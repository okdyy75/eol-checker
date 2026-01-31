/**
 * バリデーション関数
 * 
 * シンプルな入力検証を提供
 */

const MAX_SERVICE_NAME_LENGTH = 100;
const MAX_TECH_NAME_LENGTH = 50;
const MAX_VERSION_LENGTH = 20;
const VERSION_PATTERN = /^[0-9a-zA-Z.\-_]+$/;

function isEmpty(value: string): boolean {
  return !value || value.trim().length === 0;
}

/**
 * サービス名のバリデーション
 */
export function validateServiceName(name: string): string | null {
  if (isEmpty(name)) {
    return 'サービス名を入力してください';
  }
  
  if (name.trim().length > MAX_SERVICE_NAME_LENGTH) {
    return `サービス名が長すぎます。${MAX_SERVICE_NAME_LENGTH}文字以内で入力してください`;
  }
  
  return null;
}

/**
 * 技術名のバリデーション
 */
export function validateTechnologyName(name: string): string | null {
  if (isEmpty(name)) {
    return '技術名を入力してください';
  }
  
  if (name.trim().length > MAX_TECH_NAME_LENGTH) {
    return `技術名が長すぎます。${MAX_TECH_NAME_LENGTH}文字以内で入力してください`;
  }
  
  return null;
}

/**
 * バージョン形式のバリデーション
 */
export function validateVersion(version: string): string | null {
  if (isEmpty(version)) {
    return 'バージョンを入力してください';
  }
  
  if (version.trim().length > MAX_VERSION_LENGTH) {
    return `バージョンが長すぎます。${MAX_VERSION_LENGTH}文字以内で入力してください`;
  }
  
  if (!VERSION_PATTERN.test(version.trim())) {
    return 'バージョンは英数字、ドット、ハイフン、アンダースコアのみ使用できます';
  }
  
  return null;
}

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 全体的なフォームバリデーション
 */
export function validateForm(services: any[]): ValidationResult {
  const errors: string[] = [];
  
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    
    const serviceNameError = validateServiceName(service.name);
    if (serviceNameError) {
      errors.push(`サービス${i + 1}: ${serviceNameError}`);
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
