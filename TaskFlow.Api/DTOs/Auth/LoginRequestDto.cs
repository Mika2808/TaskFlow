namespace TaskFlow.Api.DTOs.Auth;

public class LoginRequestDto
{
    public string Login { get; set; } = null!;  //email lub nick
    public string Password { get; set; } = null!;
}
