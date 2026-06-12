package model

// Announcement 站内公告记录。
type Announcement struct {
	ID         string `json:"id" gorm:"primaryKey"`
	Title      string `json:"title"`
	Content    string `json:"content" gorm:"type:text"`
	Enabled    bool   `json:"enabled" gorm:"index"`
	Priority   int    `json:"priority"`
	StartAt    string `json:"startAt"`
	EndAt      string `json:"endAt"`
	ButtonText string `json:"buttonText"`
	ButtonURL  string `json:"buttonUrl"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

// AnnouncementList 公告分页结果。
type AnnouncementList struct {
	Items []Announcement `json:"items"`
	Total int            `json:"total"`
}
