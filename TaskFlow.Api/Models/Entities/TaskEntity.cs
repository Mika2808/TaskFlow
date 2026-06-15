using TaskFlow.Api.Models.Enums;

namespace TaskFlow.Api.Models.Entities;

public class TaskEntity
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public Guid? GroupId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public TaskState Status { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
