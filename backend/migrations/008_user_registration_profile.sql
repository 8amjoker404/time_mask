ALTER TABLE users
  ADD COLUMN nickname VARCHAR(40) NULL AFTER name,
  ADD COLUMN gender ENUM('female', 'male', 'non_binary', 'prefer_not_to_say') NULL AFTER nickname,
  ADD COLUMN age TINYINT UNSIGNED NULL AFTER gender,
  ADD UNIQUE INDEX uq_users_nickname (nickname);
