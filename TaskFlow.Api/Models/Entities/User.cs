namespace TaskFlow.Api.Models.Entities;
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string Nick { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public int Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}