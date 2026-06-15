namespace TaskFlow.Api.DTOs.TaskGroup;

using System.ComponentModel.DataAnnotations;

public class CreateTaskGroupDto
{
    [Required]
    public string Name { get; set; } = null!;

    [Required]
    public string Description { get; set; } = null!;
}
