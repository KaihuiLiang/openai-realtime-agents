# Alembic 資料庫遷移使用指南

## 設置完成

Alembic 已經成功整合到專案中，每次容器啟動時會自動運行 migrations。

## 日常使用流程

### 1. 修改 Model
當你需要修改資料庫結構時，直接編輯 `backend/models.py`

例如：
```python
class ExperimentPrompt(Base):
    # 添加新欄位
    new_field = Column(String, nullable=True)
```

### 2. 生成 Migration
在容器內執行：
```bash
docker compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "describe your changes"
```

這會在 `backend/alembic/versions/` 目錄下生成一個新的 migration 檔案。

### 3. 複製 Migration 到本地（可選）
如果想在版本控制中追蹤：
```bash
docker cp realtime-agents-backend:/app/alembic/versions/XXXXX_your_migration.py backend/alembic/versions/
```

### 4. 應用 Migration
重啟容器會自動應用：
```bash
docker compose -f docker-compose.dev.yml restart backend
```

或手動執行：
```bash
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

## 常用指令

### 查看當前版本
```bash
docker compose -f docker-compose.dev.yml exec backend alembic current
```

### 查看 Migration 歷史
```bash
docker compose -f docker-compose.dev.yml exec backend alembic history
```

### 回退到上一個版本
```bash
docker compose -f docker-compose.dev.yml exec backend alembic downgrade -1
```

### 回退到特定版本
```bash
docker compose -f docker-compose.dev.yml exec backend alembic downgrade <revision_id>
```

## 檔案結構

```
backend/
├── alembic/
│   ├── versions/          # Migration 檔案存放處
│   │   └── 0513789f9775_initial_migration.py
│   ├── env.py            # Alembic 環境配置
│   ├── script.py.mako    # Migration 模板
│   └── README
├── alembic.ini           # Alembic 配置檔
├── models.py             # SQLAlchemy Models
├── database.py           # 資料庫連接
└── start.sh              # 啟動腳本（包含自動 migration）
```

## 注意事項

1. **自動應用**：每次 `docker compose up` 時會自動運行 `alembic upgrade head`
2. **版本控制**：建議將 `alembic/versions/*.py` 加入 Git
3. **生產環境**：部署前先在開發環境測試 migrations
4. **資料安全**：重要資料變更前先備份資料庫
5. **審查 Migration**：Alembic 自動生成的 migration 可能不完美，執行前請審查

## 範例：添加新欄位

1. 編輯 `models.py`：
```python
class User(Base):
    # ... existing fields ...
    phone_number = Column(String, nullable=True)  # 新增欄位
```

2. 生成 migration：
```bash
docker compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "add phone number to user"
```

3. 重啟容器應用變更：
```bash
docker compose -f docker-compose.dev.yml restart backend
```

完成！資料庫會自動更新。
