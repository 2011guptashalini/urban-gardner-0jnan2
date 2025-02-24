import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import 'jest-styled-components';
import SpaceVisualizer from './SpaceVisualizer';
import { renderWithProviders } from '../../../utils/test-utils';
import { Garden, SoilType, SunlightCondition } from '../../../types/garden';
import { Crop, BagSize } from '../../../types/crops';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test data interfaces
interface TestDataOptions {
  gardenDimensions?: { length: number; width: number };
  soilType?: SoilType;
  sunlight?: SunlightCondition;
  cropCount?: number;
  spaceUtilization?: number;
}

interface TestData {
  garden: Garden;
  crops: Crop[];
}

// Mock ResizeObserver for responsive testing
const setupResizeObserver = () => {
  class ResizeObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }

  window.ResizeObserver = ResizeObserverMock;
};

// Setup test data with configurable options
const setupTestData = (options: Partial<TestDataOptions> = {}): TestData => {
  const garden: Garden = {
    id: 'test-garden-id',
    userId: 'test-user-id',
    name: 'Test Garden',
    dimensions: {
      length: options.gardenDimensions?.length || 100,
      width: options.gardenDimensions?.width || 50,
      unit: 'feet'
    },
    soilType: options.soilType || SoilType.LOAMY_SOIL,
    sunlight: options.sunlight || SunlightCondition.FULL_SUN,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const crops: Crop[] = Array.from({ length: options.cropCount || 2 }, (_, index) => ({
    id: `crop-${index}`,
    gardenId: garden.id,
    name: `Test Crop ${index}`,
    quantityNeeded: 1,
    growBags: 2,
    bagSize: BagSize.TWELVE_INCH,
    estimatedYield: 500,
    actualYield: 450,
    yieldAccuracy: 0.9,
    spaceUtilization: options.spaceUtilization || 0.5,
    isOverCapacity: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  return { garden, crops };
};

describe('SpaceVisualizer Component', () => {
  beforeEach(() => {
    setupResizeObserver();
  });

  describe('Rendering and Layout', () => {
    it('renders garden space with correct dimensions and scaling', async () => {
      const { garden, crops } = setupTestData();
      const { container } = renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.5}
        />
      );

      const visualizer = container.querySelector('[role="region"]');
      expect(visualizer).toHaveStyleRule('width', `${garden.dimensions.length}px`);
      expect(visualizer).toHaveStyleRule('height', `${garden.dimensions.width}px`);
      expect(visualizer).toBeVisible();
    });

    it('displays grow bags with proper positioning and sizing', () => {
      const { garden, crops } = setupTestData();
      const { container } = renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.5}
        />
      );

      const growBags = container.querySelectorAll('[role="button"]');
      expect(growBags).toHaveLength(crops.length);
      growBags.forEach(bag => {
        expect(bag).toHaveStyleRule('transform', expect.stringContaining('translate'));
        expect(bag).toHaveStyleRule('position', 'absolute');
      });
    });

    it('adjusts layout responsively for different screen sizes', async () => {
      const { garden, crops } = setupTestData();
      const { container, rerender } = renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.5}
        />
      );

      // Test mobile layout
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
      await waitFor(() => {
        const growBags = container.querySelectorAll('[role="button"]');
        growBags.forEach(bag => {
          expect(bag).toHaveStyleRule('transform', expect.stringContaining('scale(0.6)'));
        });
      });

      // Test desktop layout
      window.innerWidth = 1440;
      window.dispatchEvent(new Event('resize'));
      await waitFor(() => {
        const growBags = container.querySelectorAll('[role="button"]');
        growBags.forEach(bag => {
          expect(bag).toHaveStyleRule('transform', expect.stringContaining('scale(1)'));
        });
      });
    });
  });

  describe('Accessibility and User Interaction', () => {
    it('meets WCAG 2.1 accessibility standards', async () => {
      const { garden, crops } = setupTestData();
      const { container } = renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.5}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('handles keyboard navigation correctly', async () => {
      const onGrowBagClick = jest.fn();
      const { garden, crops } = setupTestData();
      renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.5}
          onGrowBagClick={onGrowBagClick}
        />
      );

      const growBags = screen.getAllByRole('button');
      growBags[0].focus();
      
      // Test keyboard interaction
      await userEvent.keyboard('{Enter}');
      expect(onGrowBagClick).toHaveBeenCalledWith(crops[0].id);

      await userEvent.keyboard('{Space}');
      expect(onGrowBagClick).toHaveBeenCalledWith(crops[0].id);
    });

    it('displays tooltips on hover with correct crop information', async () => {
      const { garden, crops } = setupTestData();
      renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.5}
          showLabels={true}
        />
      );

      const growBag = screen.getAllByRole('button')[0];
      await userEvent.hover(growBag);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent(crops[0].name);
      expect(tooltip).toBeVisible();

      await userEvent.unhover(growBag);
      await waitFor(() => {
        expect(tooltip).not.toBeVisible();
      });
    });
  });

  describe('Space Utilization and Warnings', () => {
    it('displays warning when space utilization exceeds threshold', () => {
      const { garden, crops } = setupTestData({ spaceUtilization: 0.95 });
      renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.95}
        />
      );

      const warning = screen.getByRole('alert');
      expect(warning).toHaveTextContent('Space at 95% capacity');
      expect(warning).toBeVisible();
    });

    it('updates grow bag positions when space utilization changes', async () => {
      const { garden, crops } = setupTestData();
      const { rerender, container } = renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.5}
        />
      );

      const initialPositions = Array.from(container.querySelectorAll('[role="button"]'))
        .map(bag => bag.style.transform);

      // Update space utilization
      rerender(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.8}
        />
      );

      const updatedPositions = Array.from(container.querySelectorAll('[role="button"]'))
        .map(bag => bag.style.transform);

      expect(updatedPositions).not.toEqual(initialPositions);
    });
  });

  describe('Performance and Error Handling', () => {
    it('maintains performance with maximum grow bags', async () => {
      const { garden, crops } = setupTestData({ cropCount: 50 });
      const startTime = performance.now();

      renderWithProviders(
        <SpaceVisualizer
          garden={garden}
          crops={crops}
          spaceUtilization={0.8}
        />
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // 100ms threshold

      const growBags = screen.getAllByRole('button');
      expect(growBags).toHaveLength(50);
    });

    it('handles invalid prop combinations gracefully', () => {
      const { garden, crops } = setupTestData();
      const invalidGarden = { ...garden, dimensions: { length: -1, width: -1, unit: 'feet' } };

      expect(() => {
        renderWithProviders(
          <SpaceVisualizer
            garden={invalidGarden}
            crops={crops}
            spaceUtilization={0.5}
          />
        );
      }).not.toThrow();

      const visualizer = screen.getByRole('region');
      expect(visualizer).toBeInTheDocument();
    });
  });
});