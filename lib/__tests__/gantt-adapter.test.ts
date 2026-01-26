import { 
  convertToGanttData, 
  getRelevantCycles, 
  isVersionEOL, 
  generateGanttScales 
} from '../gantt-adapter';
import { Service, EOLDataMap, EOLCycle } from '../types';

describe('gantt-adapter', () => {
  const mockEOLData: EOLDataMap = {
    'python': {
      productName: 'python',
      cycles: [
        {
          cycle: '3.8',
          releaseDate: '2019-10-14',
          eol: '2024-10-14',
        },
        {
          cycle: '3.9',
          releaseDate: '2020-10-05',
          eol: '2025-10-05',
        },
        {
          cycle: '3.10',
          releaseDate: '2021-10-04',
          eol: '2026-10-04',
        },
      ],
    },
    'nodejs': {
      productName: 'nodejs',
      cycles: [
        {
          cycle: '16',
          releaseDate: '2021-04-20',
          eol: '2024-04-30',
        },
        {
          cycle: '18',
          releaseDate: '2022-04-19',
          eol: '2025-04-30',
        },
      ],
    },
  };

  const mockServices: Service[] = [
    {
      id: '1',
      name: 'Test Service',
      technologies: [
        {
          id: '1',
          name: 'python',
          currentVersion: '3.9',
        },
        {
          id: '2',
          name: 'nodejs',
          currentVersion: '16',
        },
      ],
    },
  ];

  describe('convertToGanttData', () => {
    it('should convert services to gantt data structure', () => {
      const result = convertToGanttData(mockServices, mockEOLData);
      
      expect(result.tasks).toBeDefined();
      expect(result.scales).toBeDefined();
      expect(result.tasks.length).toBeGreaterThan(0);
    });

    it('should create tasks for each technology version', () => {
      const result = convertToGanttData(mockServices, mockEOLData);
      
      // サマリータスクは作成されない
      const summaryTasks = result.tasks.filter(task => task.type === 'summary');
      expect(summaryTasks.length).toBe(0);
      
      // バージョンタスクが作成される（期間ごとに分割される）
      const techTasks = result.tasks.filter(task => task.type === 'task');
      expect(techTasks.length).toBeGreaterThan(0);
    });

    it('should create individual tasks for each technology version', () => {
      const result = convertToGanttData(mockServices, mockEOLData);
      
      const techTasks = result.tasks.filter(task => task.type === 'task');
      expect(techTasks.length).toBeGreaterThan(0);
      
      // 各バージョンは1タスクになり、セグメントで期間を表現する
      // Python versions (3.9, 3.10) + Node.js versions (16, 18) = 4 versions
      expect(techTasks.length).toBe(4);
      
      // 各タスクにはステージ情報が含まれる
      techTasks.forEach(task => {
        expect(task.css).toMatch(/^stage-/);
        expect(task.details).toBeDefined();
        expect(task.segments).toBeDefined();
        expect(task.segments?.length).toBeGreaterThan(0);
        
        const details = JSON.parse(task.details as string);
        expect(details.stage).toBeDefined();
        expect(['current', 'active', 'maintenance', 'eol']).toContain(details.stage);
        expect(details.isCurrentVersion).toBeDefined();
      });
    });

    it('should handle missing EOL data gracefully', () => {
      const servicesWithUnknownTech: Service[] = [
        {
          id: '1',
          name: 'Test Service',
          technologies: [
            {
              id: '1',
              name: 'unknown-tech',
              currentVersion: '1.0',
            },
          ],
        },
      ];

      const result = convertToGanttData(servicesWithUnknownTech, mockEOLData);
      
      // Should not create any tasks for unknown technology
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe('getRelevantCycles', () => {
    it('should return cycles from current version onwards', () => {
      const cycles: EOLCycle[] = [
        {
          cycle: '3.8',
          releaseDate: '2019-10-14',
          eol: '2024-10-14',
        },
        {
          cycle: '3.9',
          releaseDate: '2020-10-05',
          eol: '2025-10-05',
        },
        {
          cycle: '3.10',
          releaseDate: '2021-10-04',
          eol: '2026-10-04',
        },
      ];

      const result = getRelevantCycles(cycles, '3.9');
      
      expect(result).toHaveLength(2); // 3.9 and 3.10
      expect(result[0].cycle).toBe('3.9');
      expect(result[1].cycle).toBe('3.10');
    });

    it('should return all cycles if current version not found', () => {
      const cycles: EOLCycle[] = [
        {
          cycle: '3.9',
          releaseDate: '2020-10-05',
          eol: '2025-10-05',
        },
        {
          cycle: '3.10',
          releaseDate: '2021-10-04',
          eol: '2026-10-04',
        },
      ];

      const result = getRelevantCycles(cycles, '3.7');
      
      expect(result).toHaveLength(2); // All cycles
    });

    it('should filter out cycles without valid dates', () => {
      const cycles: EOLCycle[] = [
        {
          cycle: '3.9',
          releaseDate: '2020-10-05',
          eol: '2025-10-05',
        },
        {
          cycle: '3.10',
          releaseDate: '',
          eol: false,
        },
      ];

      const result = getRelevantCycles(cycles, '3.9');
      
      expect(result).toHaveLength(1); // Only valid cycle
      expect(result[0].cycle).toBe('3.9');
    });
  });

  describe('isVersionEOL', () => {
    it('should return true for past EOL dates', () => {
      const pastDate = '2020-01-01';
      expect(isVersionEOL(pastDate)).toBe(true);
    });

    it('should return false for future EOL dates', () => {
      const futureDate = '2030-01-01';
      expect(isVersionEOL(futureDate)).toBe(false);
    });

    it('should return false for boolean false', () => {
      expect(isVersionEOL(false)).toBe(false);
    });
  });

  describe('generateGanttScales', () => {
    it('should return default scales', () => {
      const scales = generateGanttScales();
      
      expect(scales).toHaveLength(2);
      expect(scales[0]).toEqual({ unit: 'year', step: 1, format: 'YYYY' });
      expect(scales[1]).toEqual({ unit: 'month', step: 1, format: 'MMM' });
    });
  });
});
