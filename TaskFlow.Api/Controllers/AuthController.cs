using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.DTOs.Auth;
using TaskFlow.Api.Models.Entities;
using TaskFlow.Api.Models.Enums;
using TaskFlow.Api.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TaskFlowDbContext _dbContext;

    public AuthController(TaskFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    /// <summary>
    /// Registers a new user
    /// </summary>
    /// <param name="request">Registration data</param>
    /// <returns>Registration result</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(RegisterRequestDto request)
    {
        var emailExists = await _dbContext.Users
            .AnyAsync(u => u.Email == request.Email);

        if (emailExists)
        {
            return Problem(
                title: "Email already exists",
                detail: "User with provided email already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var nickExists = await _dbContext.Users
            .AnyAsync(u => u.Nick == request.Nick);

        if (nickExists)
        {
            return Problem(
                title: "Nick already exists",
                detail: "User with provided nick already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var user = new User
        {
            Email = request.Email,
            Nick = request.Nick,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);

        await _dbContext.SaveChangesAsync();

        return Ok("User registered successfully.");
    }

    /// <summary>
    /// Logs in user
    /// </summary>
    /// <param name="request">Login data</param>
    /// <returns>Authentication token</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => 
            u.Email == request.Login || 
            u.Nick == request.Login);

        if (user == null)
        {
            return Problem(
                title: "Invalid credentials",
                detail: "Login or password is incorrect.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash);

        if (!passwordValid)
        {
            return Problem(
                title: "Invalid credentials",
                detail: "Login or password is incorrect.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var token = GenerateJwtToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token
        });
    }
    // TODO wywalić to, testowa funckja do sprawdzenia czy token jest poprawnie generowany i walidowany
    /// <summary>
    /// Gets current logged user data
    /// </summary>
    /// <returns>Logged user data</returns>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (userId == null || email == null || role == null)
        {
            return Problem(
                title: "Invalid authentication token",
                detail: "The authentication token does not contain required user claims.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return Ok(new
        {
            UserId = userId,
            Email = email,
            Role = role
        });
    }
    private string GenerateJwtToken(User user)
    {
        var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var jwt = config.GetSection("Jwt");

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwt["Key"]!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role.ToString())
    };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                int.Parse(jwt["ExpiresInMinutes"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
