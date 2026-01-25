/**
 * サービス名のバリデーション
 */
export function validateServiceName(name: string): string | null {
  const normalizedName = normalizeInput(name);
  
  if (isEmpty(name)) {
    return generateErrorMessage('サービス名', 'required');
  }
  
  if (normalizedName.length > 100) {
    return generateErrorMessage('サービス名', 'tooLong', { maxLength: 100 });
  }
  
  return null;
}

/**
 * 技術名のバリデーション
 */
export function validateTechnologyName(name: string): string | null {
  const normalizedName = normalizeInput(name);
  
  if (isEmpty(name)) {
    return generateErrorMessage('技術名', 'required');
  }
  
  if (normalizedName.length > 50) {
    return generateErrorMessage('技術名', 'tooLong', { maxLength: 50 });
  }
  
  return null;
}

/**
 * バージョン形式のバリデーション
 */
export function validateVersion(version: string): string | null {
  const normalizedVersion = normalizeInput(version);
  
  if (isEmpty(version)) {
    return generateErrorMessage('バージョン', 'required');
  }
  
  if (normalizedVersion.length > 20) {
    return generateErrorMessage('バージョン', 'tooLong', { maxLength: 20 });
  }
  
  // 基本的なバージョン形式チェック（数字、ドット、ハイフンを許可）
  const versionPattern = /^[0-9a-zA-Z\.\-_]+$/;
  if (!versionPattern.test(normalizedVersion)) {
    return generateErrorMessage('バージョン', 'invalidVersion');
  }
  
  return null;
}

/**
 * エラーメッセージ生成関数
 */
export function generateErrorMessage(field: string, errorType: string, context?: any): string {
  const errorMessages: Record<string, string> = {
    required: `${field}を入力してください`,
    empty: `${field}が空です。値を入力してください`,
    tooLong: `${field}が長すぎます。${context?.maxLength || 100}文字以内で入力してください`,
    invalidFormat: `${field}の形式が正しくありません`,
    invalidVersion: `${field}は英数字、ドット、ハイフン、アンダースコアのみ使用できます`,
    noServices: '少なくとも1つのサービスを追加してください',
    noTechnologies: '少なくとも1つの技術を追加してください',
  };

  return errorMessages[errorType] || `${field}にエラーがあります`;
}

/**
 * 入力値の正規化（空白文字の除去など）
 */
export function normalizeInput(input: string): string {
  return input ? input.trim() : '';
}

/**
 * 空の値かどうかをチェック
 */
export function isEmpty(value: string): boolean {
  return !value || normalizeInput(value).length === 0;
}

/**
 * 全体的なフォームバリデーション
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * 単一フィールドのバリデーション結果を生成
 */
export function createFieldValidationResult(error: string | null): FieldValidationResult {
  return {
    isValid: error === null,
    error,
  };
}

export function validateForm(services: any[]): ValidationResult {
  const errors: string[] = [];
  
  if (!services || services.length === 0) {
    errors.push(generateErrorMessage('サービス', 'noServices'));
    return { isValid: false, errors };
  }
  
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    
    const serviceNameError = validateServiceName(service.name);
    if (serviceNameError) {
      errors.push(`サービス${i + 1}: ${serviceNameError}`);
    }
    
    if (!service.technologies || service.technologies.length === 0) {
      errors.push(`サービス${i + 1}: ${generateErrorMessage('技術', 'noTechnologies')}`);
      continue;
    }
    
    for (let j = 0; j < service.technologies.length; j++) {
      const tech = service.technologies[j];
      
      const techNameError = validateTechnologyName(tech.name);
      if (techNameError) {
        errors.push(`サービス${i + 1} 技術${j + 1}: ${techNameError}`);
      }
      
      const versionError = validateVersion(tech.currentVersion);
      if (versionError) {
        errors.push(`サービス${i + 1} 技術${j + 1}: ${versionError}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * リアルタイムバリデーション用のヘルパー関数
 */
export function validateServiceNameField(name: string): FieldValidationResult {
  return createFieldValidationResult(validateServiceName(name));
}

export function validateTechnologyNameField(name: string): FieldValidationResult {
  return createFieldValidationResult(validateTechnologyName(name));
}

export function validateVersionField(version: string): FieldValidationResult {
  return createFieldValidationResult(validateVersion(version));
}