CREATE TABLE IF NOT EXISTS user_twins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  mask_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_twins_user_mask (user_id, mask_id),
  CONSTRAINT fk_user_twins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_twins_mask FOREIGN KEY (mask_id) REFERENCES masks(id) ON DELETE CASCADE,
  INDEX idx_user_twins_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS chat_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_groups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_groups_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS chat_group_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  mask_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_chat_group_member (group_id, mask_id),
  CONSTRAINT fk_chat_group_members_group FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_group_members_mask FOREIGN KEY (mask_id) REFERENCES masks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_group_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  mask_id BIGINT UNSIGNED NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_group_messages_group FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_group_messages_mask FOREIGN KEY (mask_id) REFERENCES masks(id) ON DELETE SET NULL,
  INDEX idx_chat_group_messages_order (group_id, id)
);
