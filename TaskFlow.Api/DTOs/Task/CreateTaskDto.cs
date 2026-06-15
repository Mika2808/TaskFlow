namespace TaskFlow.Api.DTOs.Task;

using System.ComponentModel.DataAnnotations;

public class CreateTaskDto
{
    [Required]
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public Guid? GroupId { get; set; }
    public DateTime? Deadline { get; set; }
}
