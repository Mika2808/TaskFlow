namespace TaskFlow.Api.DTOs.Auth;

public class RegisterRequestDto
{
    public string Email { get; set; } = null!;
    public string Nick { get; set; } = null!;
    public string Password { get; set; } = null!;
}
