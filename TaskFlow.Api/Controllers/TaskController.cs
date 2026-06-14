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

    private Guid GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (value == null)
            throw new Exception("Missing NameIdentifier claim in JWT");

        return Guid.Parse(value);
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks()
    {
        var userId = GetUserId();

        var tasks = await _db.Tasks
            .Where(t => t.OwnerId == userId)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Status = t.Status,
                GroupId = t.GroupId,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(Guid id)
    {
        var userId = GetUserId();

        var task = await _db.Tasks
            .Where(t => t.Id == id && t.OwnerId == userId)
            .Select(t => new TaskDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Status = t.Status,
                GroupId = t.GroupId,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (task == null)
            return NotFound();

        return Ok(task);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask(CreateTaskDto request)
    {
        var userId = GetUserId();

        var task = new TaskEntity
        {
            Id = Guid.NewGuid(),
            OwnerId = userId,
            GroupId = request.GroupId,
            Name = request.Name,
            Description = request.Description,
            Status = TaskState.ToDo,
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
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };

        return Ok(result);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateTask(Guid id, UpdateTaskDto dto)
    {
        var userId = GetUserId();

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.OwnerId == userId);

        if (task == null)
            return NotFound();

        if (dto.Name != null)
            task.Name = dto.Name;

        if (dto.Description != null)
            task.Description = dto.Description;

        if (dto.Status != null)
            task.Status = dto.Status.Value;

        if (dto.GroupId.HasValue)
            task.GroupId = dto.GroupId;

        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(Guid id)
    {
        var userId = GetUserId();

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.OwnerId == userId);

        if (task == null)
            return NotFound();

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}