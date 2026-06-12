"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Modal, Tag, Typography, theme } from "antd";

import { fetchActiveAnnouncement } from "@/services/api/announcements";

const seenAnnouncementKey = "infinite-canvas:seen-announcement-id";

function isExternalURL(value: string) {
    return /^https?:\/\//i.test(value);
}

export function SiteAnnouncementModal() {
    const { token } = theme.useToken();
    const [open, setOpen] = useState(false);
    const query = useQuery({
        queryKey: ["announcements", "active"],
        queryFn: fetchActiveAnnouncement,
        retry: false,
    });
    const announcement = query.data;
    const actionURL = announcement?.buttonUrl?.trim() || "";
    const actionText = announcement?.buttonText?.trim() || "查看详情";

    useEffect(() => {
        if (!announcement) {
            setOpen(false);
            return;
        }
        setOpen(window.localStorage.getItem(seenAnnouncementKey) !== announcement.id);
    }, [announcement]);

    const closeAnnouncement = () => {
        if (announcement?.id) window.localStorage.setItem(seenAnnouncementKey, announcement.id);
        setOpen(false);
    };

    if (!announcement) return null;

    return (
        <Modal
            title={null}
            open={open}
            width={640}
            centered
            onCancel={closeAnnouncement}
            destroyOnHidden
            footer={[
                <Button key="close" onClick={closeAnnouncement}>
                    我知道了
                </Button>,
                actionURL ? (
                    <Button key="action" type="primary" href={actionURL} target={isExternalURL(actionURL) ? "_blank" : undefined} rel={isExternalURL(actionURL) ? "noreferrer" : undefined} onClick={closeAnnouncement}>
                        {actionText}
                    </Button>
                ) : null,
            ]}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        {announcement.title}
                    </Typography.Title>
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                        公告
                    </Tag>
                </div>
                <div style={{ borderRadius: 14, border: `1px solid ${token.colorBorderSecondary}`, background: token.colorFillAlter, padding: 16 }}>
                    <Typography.Paragraph style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{announcement.content}</Typography.Paragraph>
                </div>
            </div>
        </Modal>
    );
}
