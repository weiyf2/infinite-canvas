package service

import (
	"strings"
	"time"

	"github.com/basketikun/infinite-canvas/model"
	"github.com/basketikun/infinite-canvas/repository"
)

func ListAnnouncements(q model.Query) (model.AnnouncementList, error) {
	items, total, err := repository.ListAnnouncements(q)
	if err != nil {
		return model.AnnouncementList{}, err
	}
	return model.AnnouncementList{Items: items, Total: int(total)}, nil
}

func SaveAnnouncement(item model.Announcement) (model.Announcement, error) {
	item.ID = strings.TrimSpace(item.ID)
	item.Title = strings.TrimSpace(item.Title)
	item.Content = strings.TrimSpace(item.Content)
	item.ButtonText = strings.TrimSpace(item.ButtonText)
	item.ButtonURL = strings.TrimSpace(item.ButtonURL)

	if item.Title == "" {
		return item, safeMessageError{message: "请输入公告标题"}
	}
	if item.Content == "" {
		return item, safeMessageError{message: "请输入公告内容"}
	}

	startAt, startTime, err := normalizeAnnouncementTime(item.StartAt, "开始时间")
	if err != nil {
		return item, err
	}
	endAt, endTime, err := normalizeAnnouncementTime(item.EndAt, "结束时间")
	if err != nil {
		return item, err
	}
	if startTime != nil && endTime != nil && endTime.Before(*startTime) {
		return item, safeMessageError{message: "结束时间不能早于开始时间"}
	}
	item.StartAt = startAt
	item.EndAt = endAt

	now := time.Now().UTC().Format(time.RFC3339)
	if item.ID == "" {
		item.ID = newID("announcement")
		item.CreatedAt = now
	}
	item.UpdatedAt = now
	return repository.SaveAnnouncement(item)
}

func DeleteAnnouncement(id string) error {
	return repository.DeleteAnnouncement(id)
}

func ActiveAnnouncement() (*model.Announcement, error) {
	return repository.GetActiveAnnouncement(time.Now().UTC().Format(time.RFC3339))
}

func normalizeAnnouncementTime(value string, label string) (string, *time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return "", nil, safeMessageError{message: label + "格式不正确"}
	}
	normalized := parsed.UTC()
	return normalized.Format(time.RFC3339), &normalized, nil
}
