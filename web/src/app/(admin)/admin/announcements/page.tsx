"use client";

import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Card, Col, DatePicker, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Tag, Tooltip, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import type { AdminAnnouncement } from "@/services/api/admin";
import { useAdminAnnouncements } from "./use-admin-announcements";

type AnnouncementFormValues = Omit<Partial<AdminAnnouncement>, "startAt" | "endAt"> & {
    startAt?: Dayjs;
    endAt?: Dayjs;
};

const statusOptions = [
    { label: "全部状态", value: "" },
    { label: "已启用", value: "enabled" },
    { label: "已停用", value: "disabled" },
];

function formatDateTime(value?: string) {
    return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "";
}

function isAnnouncementActive(item: AdminAnnouncement) {
    const now = dayjs();
    const startAt = item.startAt ? dayjs(item.startAt) : null;
    const endAt = item.endAt ? dayjs(item.endAt) : null;
    return item.enabled && (!startAt || !startAt.isAfter(now)) && (!endAt || !endAt.isBefore(now));
}

export default function AdminAnnouncementsPage() {
    const { announcements, keyword, status, page, pageSize, total, isLoading, searchAnnouncements, changeStatus, changePage, changePageSize, resetFilters, refreshAnnouncements, saveAnnouncement: saveAdminAnnouncement, deleteAnnouncement } = useAdminAnnouncements();
    const [form] = Form.useForm<AnnouncementFormValues>();
    const [keywordText, setKeywordText] = useState(keyword);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<AdminAnnouncement> | null>(null);
    const [detailAnnouncement, setDetailAnnouncement] = useState<AdminAnnouncement | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<AdminAnnouncement | null>(null);

    useEffect(() => setKeywordText(keyword), [keyword]);

    useEffect(() => {
        if (!editingAnnouncement) return;
        form.resetFields();
        form.setFieldsValue({
            enabled: true,
            priority: 0,
            ...editingAnnouncement,
            startAt: editingAnnouncement.startAt ? dayjs(editingAnnouncement.startAt) : undefined,
            endAt: editingAnnouncement.endAt ? dayjs(editingAnnouncement.endAt) : undefined,
        });
    }, [editingAnnouncement, form]);

    const saveAnnouncement = async () => {
        const value = await form.validateFields();
        const { startAt, endAt, ...rest } = value;
        await saveAdminAnnouncement({
            ...editingAnnouncement,
            ...rest,
            enabled: Boolean(rest.enabled),
            priority: rest.priority || 0,
            startAt: startAt ? startAt.toISOString() : "",
            endAt: endAt ? endAt.toISOString() : "",
        });
        setEditingAnnouncement(null);
    };

    const columns: ProColumns<AdminAnnouncement>[] = [
        {
            title: "标题",
            dataIndex: "title",
            width: 260,
            render: (_, item) => (
                <Typography.Link strong ellipsis style={{ maxWidth: 260, display: "block" }} onClick={() => setDetailAnnouncement(item)}>
                    {item.title}
                </Typography.Link>
            ),
        },
        {
            title: "状态",
            dataIndex: "enabled",
            width: 104,
            render: (_, item) => (isAnnouncementActive(item) ? <Tag color="green">展示中</Tag> : item.enabled ? <Tag color="blue">已启用</Tag> : <Tag>已停用</Tag>),
        },
        {
            title: "优先级",
            dataIndex: "priority",
            width: 88,
            render: (_, item) => item.priority || 0,
        },
        {
            title: "展示时间",
            key: "timeRange",
            width: 300,
            render: (_, item) => <Typography.Text type="secondary">{`${formatDateTime(item.startAt) || "立即"} - ${formatDateTime(item.endAt) || "长期"}`}</Typography.Text>,
        },
        {
            title: "按钮",
            dataIndex: "buttonText",
            width: 120,
            render: (_, item) => (item.buttonText || item.buttonUrl ? <Tag color="purple">已配置</Tag> : <Typography.Text type="secondary">-</Typography.Text>),
        },
        {
            title: "更新时间",
            dataIndex: "updatedAt",
            width: 180,
            render: (_, item) => <Typography.Text type="secondary">{formatDateTime(item.updatedAt) || "-"}</Typography.Text>,
        },
        {
            title: "操作",
            key: "actions",
            width: 112,
            align: "right",
            render: (_, item) => (
                <Space size={4}>
                    <Tooltip title="详情">
                        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setDetailAnnouncement(item)} />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingAnnouncement(item)} />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => setDeletingAnnouncement(item)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <main style={{ padding: 24 }}>
            <Flex vertical gap={16}>
                <Card variant="borderless">
                    <Form layout="vertical">
                        <Row gutter={16} align="bottom">
                            <Col flex="360px">
                                <Form.Item label="关键词">
                                    <Input.Search value={keywordText} placeholder="搜索标题或内容" allowClear enterButton={<SearchOutlined />} onSearch={() => searchAnnouncements(keywordText)} onChange={(event) => setKeywordText(event.target.value)} />
                                </Form.Item>
                            </Col>
                            <Col flex="180px">
                                <Form.Item label="状态">
                                    <Select value={status} onChange={changeStatus} options={statusOptions} />
                                </Form.Item>
                            </Col>
                            <Col flex="none">
                                <Form.Item>
                                    <Space>
                                        <Button
                                            onClick={() => {
                                                setKeywordText("");
                                                resetFilters();
                                            }}
                                        >
                                            重置
                                        </Button>
                                        <Button type="primary" icon={<ReloadOutlined />} onClick={() => searchAnnouncements(keywordText)}>
                                            查询
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                <ProTable<AdminAnnouncement>
                    rowKey="id"
                    columns={columns}
                    dataSource={announcements}
                    loading={isLoading}
                    search={false}
                    defaultSize="middle"
                    tableLayout="fixed"
                    cardProps={{ variant: "borderless" }}
                    headerTitle={
                        <Space>
                            <Typography.Text strong>公告列表</Typography.Text>
                            <Tag>{total} 条</Tag>
                        </Space>
                    }
                    options={{ density: true, setting: true, reload: () => void refreshAnnouncements() }}
                    toolBarRender={() => [
                        <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setEditingAnnouncement({ enabled: true, priority: 0 })}>
                            新增
                        </Button>,
                    ]}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (value) => `共 ${value} 条`,
                        onChange: (nextPage, nextPageSize) => (nextPageSize !== pageSize ? changePageSize(nextPageSize) : changePage(nextPage)),
                    }}
                />
            </Flex>

            <Modal title={editingAnnouncement?.id ? "编辑公告" : "新增公告"} open={Boolean(editingAnnouncement)} width={760} onCancel={() => setEditingAnnouncement(null)} onOk={() => void saveAnnouncement()} okText="保存" cancelText="取消" destroyOnHidden>
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入公告标题" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="content" label="内容" rules={[{ required: true, message: "请输入公告内容" }]}>
                        <Input.TextArea rows={7} placeholder="支持换行展示，暂按纯文本处理" />
                    </Form.Item>
                    <Row gutter={14}>
                        <Col span={8}>
                            <Form.Item name="enabled" label="启用" valuePropName="checked">
                                <Switch checkedChildren="启用" unCheckedChildren="停用" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="priority" label="优先级">
                                <InputNumber precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={14}>
                        <Col span={12}>
                            <Form.Item name="startAt" label="开始展示时间">
                                <DatePicker showTime allowClear format="YYYY-MM-DD HH:mm:ss" placeholder="不填则立即展示" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="endAt" label="结束展示时间">
                                <DatePicker showTime allowClear format="YYYY-MM-DD HH:mm:ss" placeholder="不填则长期展示" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={14}>
                        <Col span={12}>
                            <Form.Item name="buttonText" label="按钮文案">
                                <Input placeholder="例如：查看详情" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="buttonUrl" label="按钮链接">
                                <Input placeholder="https:// 或站内路径" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal title="公告详情" open={Boolean(detailAnnouncement)} width={720} onCancel={() => setDetailAnnouncement(null)} footer={<Button onClick={() => setDetailAnnouncement(null)}>关闭</Button>}>
                {detailAnnouncement ? (
                    <Flex vertical gap={14}>
                        <Flex align="center" justify="space-between" gap={12}>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                {detailAnnouncement.title}
                            </Typography.Title>
                            {isAnnouncementActive(detailAnnouncement) ? <Tag color="green">展示中</Tag> : detailAnnouncement.enabled ? <Tag color="blue">已启用</Tag> : <Tag>已停用</Tag>}
                        </Flex>
                        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", margin: 0 }}>{detailAnnouncement.content}</Typography.Paragraph>
                        <Space wrap>
                            <Tag>优先级 {detailAnnouncement.priority || 0}</Tag>
                            <Tag>{formatDateTime(detailAnnouncement.startAt) || "立即展示"}</Tag>
                            <Tag>{formatDateTime(detailAnnouncement.endAt) || "长期展示"}</Tag>
                        </Space>
                        {detailAnnouncement.buttonText || detailAnnouncement.buttonUrl ? (
                            <Typography.Text type="secondary">
                                按钮：{detailAnnouncement.buttonText || "查看详情"} {detailAnnouncement.buttonUrl || ""}
                            </Typography.Text>
                        ) : null}
                    </Flex>
                ) : null}
            </Modal>

            <Modal
                title="删除公告"
                open={Boolean(deletingAnnouncement)}
                onCancel={() => setDeletingAnnouncement(null)}
                onOk={async () => {
                    if (!deletingAnnouncement) return;
                    await deleteAnnouncement(deletingAnnouncement.id);
                    setDeletingAnnouncement(null);
                }}
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
            >
                确定删除公告“{deletingAnnouncement?.title}”吗？删除后前台将不再展示该公告。
            </Modal>
        </main>
    );
}
