import unittest
from PIL import Image, ImageDraw
from core import distance, image_hash, split_masked


class SegmentationTests(unittest.TestCase):
    def test_two_disjoint_pieces_and_similar_hash(self):
        image = Image.new("RGBA", (220, 120), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        draw.rectangle((12, 12, 55, 105), fill=(80, 30, 30, 255))
        draw.rectangle((140, 12, 200, 105), fill=(20, 40, 80, 255))
        parts = split_masked(image, min_pixels=100)
        self.assertEqual(len(parts), 2)
        self.assertLess(parts[0][1][0], parts[1][1][0])
        self.assertEqual(distance(parts[0][2], image_hash(parts[0][0])), 0)
        self.assertLessEqual(distance(parts[0][2], image_hash(parts[0][0].copy())), 2)

    def test_noise_does_not_create_extra_piece(self):
        image = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        draw.rectangle((20, 20, 85, 85), fill=(0, 0, 0, 255))
        draw.point((110, 110), fill=(0, 0, 0, 255))
        self.assertEqual(len(split_masked(image, min_pixels=300)), 1)


if __name__ == "__main__":
    unittest.main()
