ALTER TABLE masks
  ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER id,
  ADD COLUMN gender ENUM('male', 'female', 'unspecified') NULL AFTER owner_user_id,
  ADD INDEX idx_masks_owner_user (owner_user_id),
  ADD CONSTRAINT fk_masks_owner_user FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;
