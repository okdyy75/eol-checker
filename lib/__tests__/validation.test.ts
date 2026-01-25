import {
  validateServiceName,
  validateTechnologyName,
  validateVersion,
  validateForm,
  ValidationResult,
  generateErrorMessage,
  normalizeInput,
  isEmpty,
  validateServiceNameField,
  validateTechnologyNameField,
  validateVersionField,
  FieldValidationResult
} from '../validation';

describe('validation', () => {
  describe('validateServiceName', () => {
    it('有効なサービス名の場合はnullを返す', () => {
      expect(validateServiceName('Valid Service')).toBeNull();
      expect(validateServiceName('Service123')).toBeNull();
      expect(validateServiceName('マイクロサービスA')).toBeNull();
    });

    it('空文字列の場合はエラーメッセージを返す', () => {
      expect(validateServiceName('')).toBe('サービス名を入力してください');
      expect(validateServiceName('   ')).toBe('サービス名を入力してください');
    });

    it('100文字を超える場合はエラーメッセージを返す', () => {
      const longName = 'a'.repeat(101);
      expect(validateServiceName(longName)).toBe('サービス名が長すぎます。100文字以内で入力してください');
    });

    it('100文字ちょうどの場合は有効', () => {
      const exactName = 'a'.repeat(100);
      expect(validateServiceName(exactName)).toBeNull();
    });
  });

  describe('validateTechnologyName', () => {
    it('有効な技術名の場合はnullを返す', () => {
      expect(validateTechnologyName('python')).toBeNull();
      expect(validateTechnologyName('nodejs')).toBeNull();
      expect(validateTechnologyName('react')).toBeNull();
    });

    it('空文字列の場合はエラーメッセージを返す', () => {
      expect(validateTechnologyName('')).toBe('技術名を入力してください');
      expect(validateTechnologyName('   ')).toBe('技術名を入力してください');
    });

    it('50文字を超える場合はエラーメッセージを返す', () => {
      const longName = 'a'.repeat(51);
      expect(validateTechnologyName(longName)).toBe('技術名が長すぎます。50文字以内で入力してください');
    });

    it('50文字ちょうどの場合は有効', () => {
      const exactName = 'a'.repeat(50);
      expect(validateTechnologyName(exactName)).toBeNull();
    });
  });

  describe('validateVersion', () => {
    it('有効なバージョンの場合はnullを返す', () => {
      expect(validateVersion('3.9')).toBeNull();
      expect(validateVersion('18.0.0')).toBeNull();
      expect(validateVersion('1.2.3-beta')).toBeNull();
      expect(validateVersion('2.0.0_rc1')).toBeNull();
      expect(validateVersion('v1.0')).toBeNull();
    });

    it('空文字列の場合はエラーメッセージを返す', () => {
      expect(validateVersion('')).toBe('バージョンを入力してください');
      expect(validateVersion('   ')).toBe('バージョンを入力してください');
    });

    it('20文字を超える場合はエラーメッセージを返す', () => {
      const longVersion = '1'.repeat(21);
      expect(validateVersion(longVersion)).toBe('バージョンが長すぎます。20文字以内で入力してください');
    });

    it('20文字ちょうどの場合は有効', () => {
      const exactVersion = '1'.repeat(20);
      expect(validateVersion(exactVersion)).toBeNull();
    });

    it('無効な文字が含まれる場合はエラーメッセージを返す', () => {
      expect(validateVersion('1.0@invalid')).toBe('バージョンは英数字、ドット、ハイフン、アンダースコアのみ使用できます');
      expect(validateVersion('1.0 space')).toBe('バージョンは英数字、ドット、ハイフン、アンダースコアのみ使用できます');
      expect(validateVersion('1.0#hash')).toBe('バージョンは英数字、ドット、ハイフン、アンダースコアのみ使用できます');
    });
  });

  describe('validateForm', () => {
    const validService = {
      id: '1',
      name: 'Valid Service',
      technologies: [
        {
          id: '1',
          name: 'python',
          currentVersion: '3.9'
        }
      ]
    };

    it('有効なフォームの場合はisValid: trueを返す', () => {
      const result = validateForm([validService]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('空の配列の場合はエラーを返す', () => {
      const result = validateForm([]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('少なくとも1つのサービスを追加してください');
    });

    it('nullまたはundefinedの場合はエラーを返す', () => {
      const result1 = validateForm(null as any);
      const result2 = validateForm(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    it('無効なサービス名の場合はエラーを返す', () => {
      const invalidService = {
        ...validService,
        name: ''
      };
      
      const result = validateForm([invalidService]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('サービス1: サービス名を入力してください');
    });

    it('技術が空の場合はエラーを返す', () => {
      const serviceWithoutTech = {
        ...validService,
        technologies: []
      };
      
      const result = validateForm([serviceWithoutTech]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('サービス1: 少なくとも1つの技術を追加してください');
    });

    it('無効な技術名の場合はエラーを返す', () => {
      const serviceWithInvalidTech = {
        ...validService,
        technologies: [
          {
            id: '1',
            name: '',
            currentVersion: '3.9'
          }
        ]
      };
      
      const result = validateForm([serviceWithInvalidTech]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('サービス1 技術1: 技術名を入力してください');
    });

    it('無効なバージョンの場合はエラーを返す', () => {
      const serviceWithInvalidVersion = {
        ...validService,
        technologies: [
          {
            id: '1',
            name: 'python',
            currentVersion: ''
          }
        ]
      };
      
      const result = validateForm([serviceWithInvalidVersion]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('サービス1 技術1: バージョンを入力してください');
    });

    it('複数のエラーがある場合はすべて返す', () => {
      const multipleErrorServices = [
        {
          id: '1',
          name: '',
          technologies: [
            {
              id: '1',
              name: '',
              currentVersion: ''
            }
          ]
        },
        {
          id: '2',
          name: 'Valid Service',
          technologies: []
        }
      ];
      
      const result = validateForm(multipleErrorServices);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('サービス1: サービス名を入力してください');
      expect(result.errors).toContain('サービス1 技術1: 技術名を入力してください');
      expect(result.errors).toContain('サービス1 技術1: バージョンを入力してください');
      expect(result.errors).toContain('サービス2: 少なくとも1つの技術を追加してください');
    });

    it('複数のサービスと技術がある場合も正しく検証する', () => {
      const multipleServices = [
        {
          id: '1',
          name: 'Service 1',
          technologies: [
            {
              id: '1',
              name: 'python',
              currentVersion: '3.9'
            },
            {
              id: '2',
              name: 'nodejs',
              currentVersion: '18.0.0'
            }
          ]
        },
        {
          id: '2',
          name: 'Service 2',
          technologies: [
            {
              id: '3',
              name: 'react',
              currentVersion: '18.2.0'
            }
          ]
        }
      ];
      
      const result = validateForm(multipleServices);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('generateErrorMessage', () => {
    it('適切なエラーメッセージを生成する', () => {
      expect(generateErrorMessage('サービス名', 'required')).toBe('サービス名を入力してください');
      expect(generateErrorMessage('技術名', 'empty')).toBe('技術名が空です。値を入力してください');
      expect(generateErrorMessage('バージョン', 'tooLong', { maxLength: 20 })).toBe('バージョンが長すぎます。20文字以内で入力してください');
      expect(generateErrorMessage('バージョン', 'invalidVersion')).toBe('バージョンは英数字、ドット、ハイフン、アンダースコアのみ使用できます');
    });

    it('未定義のエラータイプの場合はデフォルトメッセージを返す', () => {
      expect(generateErrorMessage('フィールド', 'unknownError')).toBe('フィールドにエラーがあります');
    });
  });

  describe('normalizeInput', () => {
    it('前後の空白文字を除去する', () => {
      expect(normalizeInput('  test  ')).toBe('test');
      expect(normalizeInput('\t\ntest\t\n')).toBe('test');
    });

    it('空文字列やnullの場合は空文字列を返す', () => {
      expect(normalizeInput('')).toBe('');
      expect(normalizeInput(null as any)).toBe('');
      expect(normalizeInput(undefined as any)).toBe('');
    });
  });

  describe('isEmpty', () => {
    it('空の値を正しく判定する', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty('\t\n')).toBe(true);
      expect(isEmpty(null as any)).toBe(true);
      expect(isEmpty(undefined as any)).toBe(true);
    });

    it('値がある場合はfalseを返す', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty('  test  ')).toBe(false);
      expect(isEmpty('0')).toBe(false);
    });
  });

  describe('validateServiceNameField', () => {
    it('有効な場合はisValid: trueを返す', () => {
      const result = validateServiceNameField('Valid Service');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('無効な場合はisValid: falseとエラーメッセージを返す', () => {
      const result = validateServiceNameField('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('サービス名を入力してください');
    });
  });

  describe('validateTechnologyNameField', () => {
    it('有効な場合はisValid: trueを返す', () => {
      const result = validateTechnologyNameField('python');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('無効な場合はisValid: falseとエラーメッセージを返す', () => {
      const result = validateTechnologyNameField('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('技術名を入力してください');
    });
  });

  describe('validateVersionField', () => {
    it('有効な場合はisValid: trueを返す', () => {
      const result = validateVersionField('3.9');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('無効な場合はisValid: falseとエラーメッセージを返す', () => {
      const result = validateVersionField('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('バージョンを入力してください');
    });
  });
});