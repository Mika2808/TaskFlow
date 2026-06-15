using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskFlow.Api.Data;
using TaskFlow.Api.DTOs.TaskGroup;
using TaskFlow.Api.Models.Entities;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/task-groups")]
[Authorize]
public class TaskGroupController : ControllerBase
{
    private readonly TaskFlowDbContext _db;

    public TaskGroupController(TaskFlowDbContext db)
    {
        _db = db;
    }

    private bool TryGetUserId(out Guid userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(value, out userId);
    }

    private IActionResult InvalidToken()
    {
        return Problem(
            title: "Invalid authentication token",
            detail: "The authentication token does not contain a valid user identifier.",
            statusCode: StatusCodes.Status401Unauthorized);
    }

    /// <summary>
    /// Gets all task groups for logged user
    /// </summary>
    /// <returns>User task groups</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<TaskGroupDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTaskGroups()
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var taskGroups = await _db.TaskGroups
            .Where(g => g.OwnerId == userId)
            .Select(g => new TaskGroupDto
            {
                Id = g.Id,
                Name = g.Name,
                Description = g.Description,
                CreatedAt = g.CreatedAt
            })
            .ToListAsync();

        return Ok(taskGroups);
    }

    /// <summary>
    /// Gets task group by id for logged user
    /// </summary>
    /// <param name="id">Task group id</param>
    /// <returns>Task group details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TaskGroupDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTaskGroup(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var taskGroup = await _db.TaskGroups
            .Where(g => g.Id == id && g.OwnerId == userId)
            .Select(g => new TaskGroupDto
            {
                Id = g.Id,
                Name = g.Name,
                Description = g.Description,
                CreatedAt = g.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (taskGroup == null)
        {
            return Problem(
                title: "Task group not found",
                detail: "Task group with provided id was not found for logged user.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Ok(taskGroup);
    }

    /// <summary>
    /// Creates a new task group for logged user
    /// </summary>
    /// <param name="request">Task group data</param>
    /// <returns>Created task group</returns>
    [HttpPost]
    [ProducesResponseType(typeof(TaskGroupDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateTaskGroup(CreateTaskGroupDto request)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var taskGroup = new TaskGroup
        {
            Id = Guid.NewGuid(),
            OwnerId = userId,
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        _db.TaskGroups.Add(taskGroup);
        await _db.SaveChangesAsync();

        var result = new TaskGroupDto
        {
            Id = taskGroup.Id,
            Name = taskGroup.Name,
            Description = taskGroup.Description,
            CreatedAt = taskGroup.CreatedAt
        };

        return CreatedAtAction(nameof(GetTaskGroup), new { id = taskGroup.Id }, result);
    }

    /// <summary>
    /// Updates task group for logged user
    /// </summary>
    /// <param name="id">Task group id</param>
    /// <param name="dto">Task group data to update</param>
    /// <returns>Updated task group</returns>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(TaskGroupDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTaskGroup(Guid id, UpdateTaskGroupDto dto)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var taskGroup = await _db.TaskGroups
            .FirstOrDefaultAsync(g => g.Id == id && g.OwnerId == userId);

        if (taskGroup == null)
        {
            return Problem(
                title: "Task group not found",
                detail: "Task group with provided id was not found for logged user.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (dto.Name == null && dto.Description == null)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["request"] = ["At least one task group field must be provided."]
            })
            {
                Title = "Invalid task group update request",
                Status = StatusCodes.Status400BadRequest
            });
        }

        if (dto.Name != null)
            taskGroup.Name = dto.Name;

        if (dto.Description != null)
            taskGroup.Description = dto.Description;

        await _db.SaveChangesAsync();

        var result = new TaskGroupDto
        {
            Id = taskGroup.Id,
            Name = taskGroup.Name,
            Description = taskGroup.Description,
            CreatedAt = taskGroup.CreatedAt
        };

        return Ok(result);
    }

    /// <summary>
    /// Deletes task group for logged user
    /// </summary>
    /// <param name="id">Task group id</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTaskGroup(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var taskGroup = await _db.TaskGroups
            .FirstOrDefaultAsync(g => g.Id == id && g.OwnerId == userId);

        if (taskGroup == null)
        {
            return Problem(
                title: "Task group not found",
                detail: "Task group with provided id was not found for logged user.",
                statusCode: StatusCodes.Status404NotFound);
        }

        await _db.Tasks
            .Where(t => t.GroupId == id && t.OwnerId == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.GroupId, (Guid?)null));

        _db.TaskGroups.Remove(taskGroup);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
