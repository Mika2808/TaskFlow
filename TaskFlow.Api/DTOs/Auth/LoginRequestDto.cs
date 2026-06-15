namespace TaskFlow.Api.DTOs.Auth;

using System.ComponentModel.DataAnnotations;

public class LoginRequestDto
{
    [Required]
    public string Login { get; set; } = null!;  //email lub nick

    [Required]
    public string Password { get; set; } = null!;
}
