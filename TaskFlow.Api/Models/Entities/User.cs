using TaskFlow.Api.Models.Enums;

namespace TaskFlow.Api.Models.Entities;
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string Nick { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}