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
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequestDto request)
    {
        var emailExists = await _dbContext.Users
            .AnyAsync(u => u.Email == request.Email);

        if (emailExists)
        {
            return BadRequest("Email already exists.");
        }
        // TODO walidacja danych: nick (unique), email (składnia) i hasło (składnia i długość)

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

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => 
            u.Email == request.Login || 
            u.Nick == request.Login);

        if (user == null)
            return Unauthorized("Invalid credentials");

        var passwordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash);

        if (!passwordValid)
            return Unauthorized("Invalid credentials");

        var token = GenerateJwtToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token
        });
    }
    // TODO wywalić to, testowa funckja do sprawdzenia czy token jest poprawnie generowany i walidowany
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Email = User.FindFirst(ClaimTypes.Email)?.Value,
            Role = User.FindFirst(ClaimTypes.Role)?.Value
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