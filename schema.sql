-- ============================================
-- 词林 — Supabase 数据库结构
-- ============================================

-- 主数据表
CREATE TABLE wi_entries (
  id          bigserial PRIMARY KEY,
  type        varchar(10)  NOT NULL,
  title       varchar(50)  NOT NULL,
  meaning     varchar(200),
  source      varchar(50),
  author      varchar(32),
  example     varchar(200),
  hidden      boolean      DEFAULT false,
  created_at  timestamptz  DEFAULT now(),
  updated_at  timestamptz  DEFAULT now()
);

COMMENT ON TABLE  wi_entries               IS '主数据表：成语、名言、俗语、诗词、歇后语';
COMMENT ON COLUMN wi_entries.id           IS '主键ID';
COMMENT ON COLUMN wi_entries.type         IS '条目类型：成语/名言/俗语/诗词/歇后语';
COMMENT ON COLUMN wi_entries.title        IS '标题/条目名';
COMMENT ON COLUMN wi_entries.meaning      IS '释义';
COMMENT ON COLUMN wi_entries.source       IS '出处（书名、篇名等）';
COMMENT ON COLUMN wi_entries.author       IS '作者';
COMMENT ON COLUMN wi_entries.example      IS '例句/用法示例';
COMMENT ON COLUMN wi_entries.created_at   IS '创建时间';
COMMENT ON COLUMN wi_entries.updated_at   IS '更新时间';

-- 类型字典表
CREATE TABLE wi_types (
  id          bigserial PRIMARY KEY,
  name        varchar(10) NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE  wi_types              IS '类型字典表：成语/名言/俗语/诗词/歇后语等';
COMMENT ON COLUMN wi_types.id          IS '主键ID';
COMMENT ON COLUMN wi_types.name        IS '类型名称';
COMMENT ON COLUMN wi_types.created_at  IS '创建时间';

-- 标签字典表
CREATE TABLE wi_tags (
  id          bigserial PRIMARY KEY,
  name        varchar(20) NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE  wi_tags                  IS '标签字典表：管理员维护';
COMMENT ON COLUMN wi_tags.id              IS '主键ID';
COMMENT ON COLUMN wi_tags.name            IS '标签名';
COMMENT ON COLUMN wi_tags.created_at      IS '创建时间';

-- 条目↔标签关联表
CREATE TABLE wi_entry_tags (
  entry_id    bigint NOT NULL,
  tag_id      bigint NOT NULL,
  PRIMARY KEY (entry_id, tag_id)
);

COMMENT ON TABLE  wi_entry_tags            IS '条目与标签的多对多关联表';
COMMENT ON COLUMN wi_entry_tags.entry_id   IS '条目ID，关联 wi_entries.id';
COMMENT ON COLUMN wi_entry_tags.tag_id     IS '标签ID，关联 wi_tags.id';

-- 管理员表
CREATE TABLE wi_admins (
  id            bigserial PRIMARY KEY,
  email         varchar(255) NOT NULL UNIQUE,
  password_hash text         NOT NULL,
  created_at    timestamptz  DEFAULT now()
);

COMMENT ON TABLE  wi_admins                IS '管理员账号表';
COMMENT ON COLUMN wi_admins.id            IS '主键ID';
COMMENT ON COLUMN wi_admins.email          IS '邮箱，用作登录账号';
COMMENT ON COLUMN wi_admins.password_hash  IS '登录密码bcrypt哈希';
COMMENT ON COLUMN wi_admins.created_at     IS '创建时间';

-- --------------------------------------------
-- 辅助函数：安全插入标签关联（INSERT ON CONFLICT DO NOTHING）
-- --------------------------------------------
CREATE OR REPLACE FUNCTION wi_upsert_entry_tags(rows_json text)
RETURNS void AS $$
BEGIN
  INSERT INTO wi_entry_tags (entry_id, tag_id)
  SELECT (r->>'entry_id')::bigint, (r->>'tag_id')::bigint
  FROM json_array_elements(rows_json::json) AS r
  ON CONFLICT (entry_id, tag_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- 索引
-- --------------------------------------------
CREATE INDEX idx_wi_entries_type   ON wi_entries (type);
CREATE INDEX idx_wi_entry_tags_tag ON wi_entry_tags (tag_id);

-- --------------------------------------------
-- 初始数据：类型
INSERT INTO wi_types (name) VALUES ('成语'), ('名言'), ('俗语'), ('诗词'), ('歇后语');

-- 初始数据：标签
-- --------------------------------------------
INSERT INTO wi_tags (name) VALUES
  ('多余'), ('失误'), ('决心'), ('奋斗'), ('英雄'), ('生活'), ('热爱'),
  ('实践'), ('学习'), ('认知'), ('自信'), ('豁达'), ('人生'), ('积累'),
  ('因果'), ('变化'), ('无常'), ('才能'), ('竞争'), ('责任'), ('奉献'),
  ('国家'), ('坚持'), ('恒心');

-- --------------------------------------------
-- 初始数据：主数据（关联标签单独插入）
-- --------------------------------------------
INSERT INTO wi_entries (type, title, meaning, source, author, example) VALUES
  ('成语', '画蛇添足', '画蛇时给蛇添上脚。比喻做了多余的事，反而不恰当。', '《战国策·齐策二》', NULL, '文章已经写得很完整了，再加一段总结反而显得啰嗦，有画蛇添足之嫌。'),
  ('成语', '破釜沉舟', '打破饭锅，凿沉渡船。比喻下定决心，不留退路。', '《史记·项羽本纪》', NULL, '面对这次竞聘，他破釜沉舟，辞去了原来的工作。'),
  ('名言', '世上只有一种英雄主义', '世界上只有一种真正的英雄主义，那就是在认清生活的真相后，依然热爱生活。', '《约翰·克利斯朵夫》', '罗曼·罗兰', '生活已经如此艰难，但他依然保持乐观——这正是罗曼·罗兰所说的英雄主义。'),
  ('名言', '不登高山不知天', '不登上高山，就不知道天有多高；不靠近深谷，就不知道地有多厚。比喻不亲身实践，就不知道事物的真实情况。', '《荀子·劝学》', NULL, '不登高山不知天，只有走出去实地考察，才能做出准确的判断。'),
  ('诗词', '天生我材必有用', '上天生下我，必定有需要我的地方；千金散尽，也还会再回来。表达自信豁达的人生态度。', '《将进酒》', '李白', '虽然这次创业失败了，但他始终相信天生我材必有用，收拾心情再出发。'),
  ('俗语', '冰冻三尺非一日之寒', '水结冰到三尺厚，不是一天的寒冷所能达到的。比喻一种情况的形成，是经过长时间的积累和酝酿的。', NULL, NULL, '他的懒惰并非一朝一夕，冰冻三尺非一日之寒，要改也不是一朝一夕的事。'),
  ('成语', '朝三暮四', '原指玩弄手法欺骗人，后用来比喻常常变卦，反复无常。', '《庄子·齐物论》', NULL, '做事最忌朝三暮四，今天想做这个，明天想做那个，到头来一事无成。'),
  ('歇后语', '八仙过海', '八仙过海时各自施展自己的法术。比喻做事各有各的一套办法。', NULL, NULL, '这次比赛高手云集，可以说是八仙过海——各显神通。'),
  ('名言', '不要问', '鼓励人们关注自身对社会的贡献。', '就职演说', '约翰·肯尼迪', '肯尼迪那句''不要问你的国家能为你做什么''，至今仍是责任意识的经典表达。'),
  ('成语', '滴水穿石', '水不停地滴，石头也能穿。比喻只要有恒心，不断努力，事情就一定能成功。', '宋代·罗大经《鹤林玉露》', NULL, '十年磨一剑，滴水穿石，他的努力终于得到了回报。');

-- --------------------------------------------
-- 初始数据：条目↔标签关联
-- --------------------------------------------
INSERT INTO wi_entry_tags (entry_id, tag_id)
SELECT e.id, t.id
FROM wi_entries e
JOIN wi_tags t ON (
  (e.title = '画蛇添足' AND t.name IN ('多余', '失误')) OR
  (e.title = '破釜沉舟' AND t.name IN ('决心', '奋斗')) OR
  (e.title = '世上只有一种英雄主义' AND t.name IN ('英雄', '生活', '热爱')) OR
  (e.title = '不登高山不知天' AND t.name IN ('实践', '学习', '认知')) OR
  (e.title = '天生我材必有用' AND t.name IN ('自信', '豁达', '人生')) OR
  (e.title = '冰冻三尺非一日之寒' AND t.name IN ('积累', '因果')) OR
  (e.title = '朝三暮四' AND t.name IN ('变化', '无常')) OR
  (e.title = '八仙过海' AND t.name IN ('才能', '竞争')) OR
  (e.title = '不要问' AND t.name IN ('责任', '奉献', '国家')) OR
  (e.title = '滴水穿石' AND t.name IN ('坚持', '恒心', '奋斗'))
);

-- --------------------------------------------
-- 初始管理员（密码为 'admin123' 的 bcrypt 哈希）
-- --------------------------------------------
-- 请在 Supabase 控制台替换为你的邮箱，并用真实 bcrypt 哈希替换 password_hash
-- 临时哈希：$2b$10$EqKcp1WFKbMoVRGNp.6e4OAu5Ir0bznOgzh6MVOB7VmI/O9sTh3GG
INSERT INTO wi_admins (email, password_hash) VALUES
  ('admin@example.com', '$2b$10$EqKcp1WFKbMoVRGNp.6e4OAu5Ir0bznOgzh6MVOB7VmI/O9sTh3GG');
