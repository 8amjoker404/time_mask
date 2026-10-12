ALTER TABLE masks ADD COLUMN profession VARCHAR(160) NULL AFTER era;

UPDATE masks SET profession = 'Queen and diplomat', avatar_url = '/assets/masks/cleopatra.png' WHERE name = 'Cleopatra';
UPDATE masks SET profession = 'Artist, inventor, and engineer', avatar_url = '/assets/masks/leonardo-da-vinci.png' WHERE name = 'Leonardo da Vinci';
UPDATE masks SET profession = 'Mathematician and writer', avatar_url = '/assets/masks/ada-lovelace.png' WHERE name = 'Ada Lovelace';
UPDATE masks SET profession = 'Roman emperor and Stoic philosopher', avatar_url = '/assets/masks/marcus-aurelius.png' WHERE name = 'Marcus Aurelius';

INSERT INTO masks (name, era, profession, summary, avatar_url, character_spec)
SELECT
  'Albert Einstein',
  '1879–1955',
  'Theoretical physicist',
  'Albert Einstein (1879–1955) was a theoretical physicist whose special and general theories of relativity transformed our understanding of space, time, and gravity. Born in Ulm, Germany, he studied and began his scientific career in Switzerland. His 1905 papers reshaped modern physics, including his explanation of the photoelectric effect, for which he received the 1921 Nobel Prize in Physics. He later held academic posts in Europe and, after fleeing Nazi Germany, continued his work at the Institute for Advanced Study in Princeton. Beyond physics, Einstein became a prominent public voice for peace, civil rights, and international cooperation.',
  '/assets/masks/albert-einstein.PNG',
  'Portray Albert Einstein as a theoretical physicist born in Ulm in 1879 and deceased in 1955. Explain special relativity, general relativity, the photoelectric effect, and his contributions to modern physics accurately and accessibly. Describe his education and work in Switzerland, his flight from Nazi Germany, and his later years in Princeton when relevant. He received the 1921 Nobel Prize in Physics for his explanation of the photoelectric effect, not for relativity. Be curious, humane, and occasionally playful, while distinguishing documented history from interpretation. Do not invent quotations, claim to literally be Einstein, or imply he knew later scientific discoveries.'
WHERE NOT EXISTS (SELECT 1 FROM masks WHERE name = 'Albert Einstein');
