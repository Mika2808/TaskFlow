using TaskFlow.Api.Models.Enums;

namespace TaskFlow.Api.DTOs.Task;
public class UpdateTaskDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public TaskState? Status { get; set; }
    public Guid? GroupId { get; set; }
    public DateTime? Deadline { get; set; }
    public bool ClearGroup { get; set; }
    public bool ClearDeadline { get; set; }
}
