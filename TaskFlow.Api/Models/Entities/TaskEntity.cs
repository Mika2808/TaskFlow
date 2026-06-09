namespace TaskFlow.Api.Models.Entities;

public class TaskEntity
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public Guid? GroupId { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public TaskStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}