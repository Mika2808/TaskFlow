namespace TaskFlow.Api.DTOs.Task;
using TaskFlow.Api.Models.Enums;

public class TaskDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }

    public TaskState Status { get; set; }

    public Guid? GroupId { get; set; }
    public DateTime? Deadline { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
