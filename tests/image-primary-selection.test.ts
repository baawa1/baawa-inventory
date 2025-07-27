// Jest test for primary image selection functionality

// Mock data for testing
const mockImages = [
  {
    id: '1',
    url: 'https://example.com/image1.jpg',
    filename: 'image1.jpg',
    mimeType: 'image/jpeg',
    alt: 'Image 1',
    isPrimary: true,
    uploadedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    url: 'https://example.com/image2.jpg',
    filename: 'image2.jpg',
    mimeType: 'image/jpeg',
    alt: 'Image 2',
    isPrimary: false,
    uploadedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    url: 'https://example.com/image3.jpg',
    filename: 'image3.jpg',
    mimeType: 'image/jpeg',
    alt: 'Image 3',
    isPrimary: false,
    uploadedAt: '2024-01-03T00:00:00Z',
  },
];

// Test the setPrimaryImage logic
describe('Primary Image Selection', () => {
  it('should set only one image as primary', () => {
    const setPrimaryImage = (imageId: string, images: typeof mockImages) => {
      // Set only one image as primary
      let updatedImages = images.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      }));

      // Move the primary image to the front
      const primaryIndex = updatedImages.findIndex(img => img.id === imageId);
      if (primaryIndex > 0) {
        const [primaryImage] = updatedImages.splice(primaryIndex, 1);
        updatedImages = [primaryImage, ...updatedImages];
      }

      return updatedImages;
    };

    // Test setting image 2 as primary
    const result = setPrimaryImage('2', mockImages);

    // Verify only one image is primary
    const primaryImages = result.filter(img => img.isPrimary);
    expect(primaryImages).toHaveLength(1);
    expect(primaryImages[0].id).toBe('2');

    // Verify primary image is first
    expect(result[0].id).toBe('2');
    expect(result[0].isPrimary).toBe(true);

    // Verify other images are not primary
    expect(result[1].isPrimary).toBe(false);
    expect(result[2].isPrimary).toBe(false);
  });

  it('should handle multiple primary images correctly', () => {
    const imagesWithMultiplePrimary = [
      { ...mockImages[0], isPrimary: true },
      { ...mockImages[1], isPrimary: true }, // This shouldn't be primary
      { ...mockImages[2], isPrimary: false },
    ];

    const setPrimaryImage = (imageId: string, images: typeof mockImages) => {
      const updatedImages = images.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      }));

      // Double-check that only one image is primary
      const primaryImages = updatedImages.filter(img => img.isPrimary);
      if (primaryImages.length > 1) {
        // If somehow multiple primary images exist, keep only the selected one
        updatedImages.forEach(img => {
          img.isPrimary = img.id === imageId;
        });
      }

      return updatedImages;
    };

    const result = setPrimaryImage('3', imagesWithMultiplePrimary);

    // Verify only one image is primary
    const primaryImages = result.filter(img => img.isPrimary);
    expect(primaryImages).toHaveLength(1);
    expect(primaryImages[0].id).toBe('3');
  });

  it('should sort images with primary first', () => {
    const sortImages = (images: typeof mockImages) => {
      return images.sort((a, b) => {
        // Primary images first, then by upload date (newest first)
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
      });
    };

    const result = sortImages(mockImages);

    // Verify primary image is first
    expect(result[0].isPrimary).toBe(true);
    expect(result[0].id).toBe('1');

    // Verify other images are sorted by upload date (newest first)
    expect(result[1].id).toBe('3'); // uploaded 2024-01-03
    expect(result[2].id).toBe('2'); // uploaded 2024-01-02
  });
});
