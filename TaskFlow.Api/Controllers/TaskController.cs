using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskFlow.Api.Data;
using TaskFlow.Api.DTOs.Task;
using TaskFlow.Api.Models.Entities;
using TaskFlow.Api.Models.Enums;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TaskController : ControllerBase
{
    private readonly TaskFlowDbContext _db;

    public TaskController(TaskFlowDbContext db)
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

    private async Task<bool> TaskGroupExists(Guid groupId, Guid userId)
    {
        return await _db.TaskGroups.AnyAsync(g => g.Id == groupId && g.OwnerId == userId);
    }

    /// <summary>
    /// Gets all tasks for logged user
    /// </summary>
    /// <param name="status">Task status filter</param>
    /// <param name="groupId">Task group id filter</param>
    /// <param name="sortBy">Task sorting field. Supported values: createdAt, deadline</param>
    /// <returns>User tasks</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTasks(
        [FromQuery] TaskState? status,
        [FromQuery] Guid? groupId,
        [FromQuery] string? sortBy)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var query = _db.Tasks
            .Where(t => t.OwnerId == userId);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        if (groupId.HasValue)
            query = query.Where(t => t.GroupId == groupId.Value);

        if (sortBy != null)
        {
            query = sortBy.ToLowerInvariant() switch
            {
                "createdat" => query.OrderByDescending(t => t.CreatedAt),
                "deadline" => query.OrderBy(t => t.Deadline == null).ThenBy(t => t.Deadline),
                _ => null
            };

            if (query == null)
            {
                return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
                {
                    [nameof(sortBy)] = ["Supported values are: createdAt, deadline."]
                })
                {
                    Title = "Invalid task sort request",
                    Status = StatusCodes.Status400BadRequest
                });
            }
        }

        var tasks = await query
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Status = t.Status,
                GroupId = t.GroupId,
                Deadline = t.Deadline,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return Ok(tasks);
    }

    /// <summary>
    /// Gets task by id for logged user
    /// </summary>
    /// <param name="id">Task id</param>
    /// <returns>Task details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTask(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var task = await _db.Tasks
            .Where(t => t.Id == id && t.OwnerId == userId)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Status = t.Status,
                GroupId = t.GroupId,
                Deadline = t.Deadline,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (task == null)
        {
            return Problem(
                title: "Task not found",
                detail: "Task with provided id was not found for logged user.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Ok(task);
    }
    
    /// <summary>
    /// Creates a new task for logged user
    /// </summary>
    /// <param name="request">Task data</param>
    /// <returns>Created task</returns>
    [HttpPost]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateTask(CreateTaskDto request)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        if (request.GroupId.HasValue && !await TaskGroupExists(request.GroupId.Value, userId))
        {
            return Problem(
                title: "Task group not found",
                detail: "Task group with provided id was not found for logged user.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var task = new TaskEntity
        {
            Id = Guid.NewGuid(),
            OwnerId = userId,
            GroupId = request.GroupId,
            Name = request.Name,
            Description = request.Description,
            Status = TaskState.ToDo,
            Deadline = request.Deadline,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        var result = new TaskDto
        {
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Status = task.Status,
            GroupId = task.GroupId,
            Deadline = task.Deadline,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };

        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, result);
    }

    /// <summary>
    /// Updates task for logged user
    /// </summary>
    /// <param name="id">Task id</param>
    /// <param name="dto">Task data to update</param>
    /// <returns>Updated task</returns>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTask(Guid id, UpdateTaskDto dto)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.OwnerId == userId);

        if (task == null)
        {
            return Problem(
                title: "Task not found",
                detail: "Task with provided id was not found for logged user.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (dto.Name == null && dto.Description == null && dto.Status == null && !dto.GroupId.HasValue && !dto.Deadline.HasValue)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["request"] = ["At least one task field must be provided."]
            })
            {
                Title = "Invalid task update request",
                Status = StatusCodes.Status400BadRequest
            });
        }

        if (dto.Name != null)
            task.Name = dto.Name;

        if (dto.Description != null)
            task.Description = dto.Description;

        if (dto.Status != null)
            task.Status = dto.Status.Value;

        if (dto.Deadline.HasValue)
            task.Deadline = dto.Deadline;

        if (dto.GroupId.HasValue)
        {
            if (!await TaskGroupExists(dto.GroupId.Value, userId))
            {
                return Problem(
                    title: "Task group not found",
                    detail: "Task group with provided id was not found for logged user.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            task.GroupId = dto.GroupId;
        }

        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var result = new TaskDto
        {
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Status = task.Status,
            GroupId = task.GroupId,
            Deadline = task.Deadline,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };

        return Ok(result);
    }

    /// <summary>
    /// Deletes task for logged user
    /// </summary>
    /// <param name="id">Task id</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTask(Guid id)
    {
        if (!TryGetUserId(out var userId))
            return InvalidToken();

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.OwnerId == userId);

        if (task == null)
        {
            return Problem(
                title: "Task not found",
                detail: "Task with provided id was not found for logged user.",
                statusCode: StatusCodes.Status404NotFound);
        }

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
