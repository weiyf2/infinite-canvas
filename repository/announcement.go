package repository

import (
	"errors"

	"github.com/basketikun/infinite-canvas/model"
	"gorm.io/gorm"
)

// ListAnnouncements 按查询条件返回公告分页列表。
func ListAnnouncements(q model.Query) ([]model.Announcement, int64, error) {
	db, err := DB()
	if err != nil {
		return nil, 0, err
	}
	q.Normalize()
	tx := applyAnnouncementFilters(db.Model(&model.Announcement{}), q)

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.Announcement
	err = tx.Order("updated_at desc").Offset(q.Offset()).Limit(q.PageSize).Find(&items).Error
	return items, total, err
}

// SaveAnnouncement 保存公告，并在更新时保留原创建时间。
func SaveAnnouncement(item model.Announcement) (model.Announcement, error) {
	db, err := DB()
	if err != nil {
		return item, err
	}
	if saved, ok, err := findAnnouncement(db, item.ID); err != nil {
		return item, err
	} else if ok && item.CreatedAt == "" {
		item.CreatedAt = saved.CreatedAt
	}
	return item, db.Save(&item).Error
}

// DeleteAnnouncement 删除指定公告。
func DeleteAnnouncement(id string) error {
	db, err := DB()
	if err != nil {
		return err
	}
	return db.Delete(&model.Announcement{}, "id = ?", id).Error
}

// GetActiveAnnouncement 返回当前最优先展示的一条公告。
func GetActiveAnnouncement(now string) (*model.Announcement, error) {
	db, err := DB()
	if err != nil {
		return nil, err
	}
	item := model.Announcement{}
	err = db.Model(&model.Announcement{}).
		Where("enabled = ?", true).
		Where("(start_at = '' OR start_at <= ?)", now).
		Where("(end_at = '' OR end_at >= ?)", now).
		Order("priority desc").
		Order("updated_at desc").
		First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// applyAnnouncementFilters 应用公告列表的搜索条件。
func applyAnnouncementFilters(tx *gorm.DB, q model.Query) *gorm.DB {
	if q.Keyword != "" {
		like := "%" + q.Keyword + "%"
		tx = tx.Where("title LIKE ? OR content LIKE ?", like, like)
	}
	switch q.Type {
	case "enabled", "true":
		tx = tx.Where("enabled = ?", true)
	case "disabled", "false":
		tx = tx.Where("enabled = ?", false)
	}
	return tx
}

// findAnnouncement 根据 ID 查询公告。
func findAnnouncement(db *gorm.DB, id string) (model.Announcement, bool, error) {
	item := model.Announcement{}
	if id == "" {
		return item, false, nil
	}
	err := db.Where("id = ?", id).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Announcement{}, false, nil
	}
	return item, err == nil, err
}
