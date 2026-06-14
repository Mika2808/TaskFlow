namespace TaskFlow.Api.DTOs.Task;

public class CreateTaskDto
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public Guid? GroupId { get; set; }
}
