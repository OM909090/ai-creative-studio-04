import {
  CommandIntent,
  EntityType,
  NLPEntity,
  CommandParsing,
  ContextInfo,
  NLPSuggestion,
  SemanticSimilarity,
  CommandValidation
} from '@/types/nlp';

export class NLPProcessor {
  private static instance: NLPProcessor;
  private commandHistory: CommandParsing[] = [];
  private commonPatterns: Map<string, CommandIntent> = new Map();
  private entityPatterns: Map<EntityType, RegExp> = new Map();

  private constructor() {
    this.initializePatterns();
  }

  public static getInstance(): NLPProcessor {
    if (!NLPProcessor.instance) {
      NLPProcessor.instance = new NLPProcessor();
    }
    return NLPProcessor.instance;
  }

  private initializePatterns(): void {
    this.entityPatterns.set('url', /https?:\/\/[^\s]+/gi);
    this.entityPatterns.set('email', /[^\s@]+@[^\s@]+\.[^\s@]+/gi);
    this.entityPatterns.set('number', /\d+(\.\d+)?/g);
    this.entityPatterns.set('date', /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/g);
    this.entityPatterns.set('time', /\d{1,2}:\d{2}(?::\d{2})?(?:\s?(?:AM|PM|am|pm))?/g);

    this.commonPatterns.set('navigate', 'web_navigate');
    this.commonPatterns.set('go to', 'web_navigate');
    this.commonPatterns.set('open', 'web_navigate');
    this.commonPatterns.set('visit', 'web_navigate');
    this.commonPatterns.set('extract', 'data_extract');
    this.commonPatterns.set('get', 'data_extract');
    this.commonPatterns.set('find', 'data_extract');
    this.commonPatterns.set('search', 'data_extract');
    this.commonPatterns.set('fill', 'form_submit');
    this.commonPatterns.set('submit', 'form_submit');
    this.commonPatterns.set('send', 'form_submit');
    this.commonPatterns.set('edit', 'content_edit');
    this.commonPatterns.set('modify', 'content_edit');
    this.commonPatterns.set('change', 'content_edit');
    this.commonPatterns.set('tell me', 'information_query');
    this.commonPatterns.set('what is', 'information_query');
    this.commonPatterns.set('how to', 'information_query');
    this.commonPatterns.set('explain', 'information_query');
  }

  public parseCommand(text: string, context?: ContextInfo): CommandParsing {
    const normalizedText = this.normalizeText(text);
    const intent = this.detectIntent(normalizedText);
    const entities = this.extractEntities(normalizedText);
    const keywords = this.extractKeywords(normalizedText);
    const actionVerbs = this.extractActionVerbs(normalizedText);
    const modifiers = this.extractModifiers(normalizedText);
    const complexity = this.assessComplexity(normalizedText, entities.length);
    const parameters = this.extractParameters(normalizedText, intent, entities);
    const confidence = this.calculateConfidence(intent, entities, keywords);

    const parsing: CommandParsing = {
      originalText: text,
      normalizedText,
      intent,
      confidence,
      entities,
      keywords,
      actionVerbs,
      modifiers,
      parameters,
      complexity
    };

    if (confidence < 0.7) {
      parsing.suggestedAlternatives = this.suggestAlternatives(text);
    }

    this.commandHistory.push(parsing);
    return parsing;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\-\.@/:]/g, '')
      .replace(/\s+/g, ' ');
  }

  private detectIntent(text: string): CommandIntent {
    for (const [pattern, intent] of this.commonPatterns) {
      if (text.includes(pattern)) {
        return intent as CommandIntent;
      }
    }

    if (text.includes('control') || text.includes('set') || text.includes('configure')) {
      return 'system_control';
    }

    if (text.includes('task') || text.includes('queue') || text.includes('schedule')) {
      return 'task_management';
    }

    return 'unknown';
  }

  private extractEntities(text: string): NLPEntity[] {
    const entities: NLPEntity[] = [];

    for (const [type, pattern] of this.entityPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            type: type as EntityType,
            value: match[0],
            confidence: 0.95,
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      }
    }

    return entities;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'please', 'thank'
    ]);

    const words = text.split(' ')
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);

    return [...new Set(words)];
  }

  private extractActionVerbs(text: string): string[] {
    const verbs = [
      'navigate', 'go', 'open', 'visit', 'extract', 'get', 'find', 'search',
      'fill', 'submit', 'send', 'edit', 'modify', 'change', 'tell', 'explain',
      'show', 'create', 'delete', 'update', 'read', 'write', 'click', 'scroll'
    ];

    return verbs.filter(verb => text.includes(verb));
  }

  private extractModifiers(text: string): string[] {
    const modifiers = [
      'quickly', 'slowly', 'carefully', 'safely', 'quietly', 'loudly',
      'all', 'some', 'many', 'few', 'most', 'every', 'any',
      'new', 'old', 'current', 'recent', 'previous', 'next'
    ];

    return modifiers.filter(mod => text.includes(mod));
  }

  private assessComplexity(text: string, entityCount: number): 'simple' | 'moderate' | 'complex' {
    const wordCount = text.split(' ').length;
    const hasMultipleVerbs = (text.match(/navigate|extract|fill|edit/g) || []).length > 1;
    const hasConditionals = /if|when|unless|provided/i.test(text);

    if (entityCount > 3 || wordCount > 20 || (hasMultipleVerbs && hasConditionals)) {
      return 'complex';
    }
    if (wordCount > 10 || hasMultipleVerbs || entityCount > 1) {
      return 'moderate';
    }
    return 'simple';
  }

  private extractParameters(
    text: string,
    intent: CommandIntent,
    entities: NLPEntity[]
  ): Record<string, any> {
    const parameters: Record<string, any> = {};

    if (intent === 'web_navigate' || intent === 'data_extract') {
      const urlEntity = entities.find(e => e.type === 'url');
      if (urlEntity) {
        parameters.url = urlEntity.value;
      }
    }

    if (intent === 'form_submit') {
      const emails = entities.filter(e => e.type === 'email');
      if (emails.length > 0) {
        parameters.emails = emails.map(e => e.value);
      }
    }

    const dateEntity = entities.find(e => e.type === 'date');
    if (dateEntity) {
      parameters.date = dateEntity.value;
    }

    return parameters;
  }

  private calculateConfidence(
    intent: CommandIntent,
    entities: NLPEntity[],
    keywords: string[]
  ): number {
    let confidence = 0.5;

    if (intent !== 'unknown') {
      confidence += 0.2;
    }

    if (entities.length > 0) {
      confidence += 0.15;
    }

    if (keywords.length > 0) {
      confidence += 0.15;
    }

    if (entities.every(e => e.confidence > 0.9)) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  private suggestAlternatives(text: string): string[] {
    const suggestions: string[] = [];

    if (!text.includes('http')) {
      suggestions.push(`Did you mean to provide a URL? ${text} https://example.com`);
    }

    if (text.length < 5) {
      suggestions.push('Your command is quite short. Please provide more details.');
    }

    if (text.includes('plz')) {
      suggestions.push(text.replace('plz', 'please'));
    }

    return suggestions.slice(0, 3);
  }

  public validateCommand(text: string): CommandValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (text.length === 0) {
      errors.push('Command cannot be empty');
    }

    if (text.length > 1000) {
      errors.push('Command is too long (max 1000 characters)');
    }

    if (text.includes('<') || text.includes('>') || text.includes(';')) {
      warnings.push('Command contains potentially dangerous characters');
    }

    if (text.toLowerCase().includes('delete all') || text.toLowerCase().includes('drop all')) {
      errors.push('Destructive operations require explicit confirmation');
    }

    if (text.split(' ').length < 2) {
      suggestions.push('Consider providing more context for better understanding');
    }

    const sanitizedCommand = this.sanitizeCommand(text);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      sanitizedCommand
    };
  }

  private sanitizeCommand(text: string): string {
    return text
      .replace(/[<>]/g, '')
      .replace(/;/g, '')
      .replace(/['"]/g, '')
      .trim();
  }

  public calculateSimilarity(text1: string, text2: string): SemanticSimilarity {
    const norm1 = this.normalizeText(text1);
    const norm2 = this.normalizeText(text2);

    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));

    let matchCount = 0;
    for (const word of words1) {
      if (words2.has(word)) {
        matchCount++;
      }
    }

    const totalWords = Math.max(words1.size, words2.size);
    const similarity = totalWords > 0 ? matchCount / totalWords : 0;

    return {
      text1,
      text2,
      similarity,
      explanation: similarity > 0.8
        ? 'Very similar commands'
        : similarity > 0.5
          ? 'Moderately similar'
          : 'Different commands'
    };
  }

  public generateSuggestions(text: string): NLPSuggestion[] {
    const suggestions: NLPSuggestion[] = [];

    const validation = this.validateCommand(text);
    validation.suggestions.forEach(sugg => {
      suggestions.push({
        original: text,
        suggestion: sugg,
        confidence: 0.85,
        reason: 'Clarity improvement',
        category: 'clarity'
      });
    });

    const words = text.split(' ');
    words.forEach((word, idx) => {
      const similar = this.findSimilarWords(word);
      if (similar.length > 0) {
        const suggestion = [...words];
        suggestion[idx] = similar[0];
        suggestions.push({
          original: text,
          suggestion: suggestion.join(' '),
          confidence: 0.75,
          reason: `Did you mean '${similar[0]}'?`,
          category: 'spelling'
        });
      }
    });

    return suggestions.slice(0, 3);
  }

  private findSimilarWords(word: string): string[] {
    const dictionary = [
      'navigate', 'go', 'open', 'visit', 'extract', 'get', 'find', 'search',
      'fill', 'submit', 'send', 'edit', 'modify', 'change', 'create', 'delete'
    ];

    return dictionary.filter(dictWord =>
      this.levenshteinDistance(word, dictWord) <= 2
    );
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  public getCommandHistory(limit: number = 20): CommandParsing[] {
    return this.commandHistory.slice(-limit).reverse();
  }

  public analyzePatterns(): { intent: CommandIntent; count: number }[] {
    const patterns: Record<CommandIntent, number> = {
      web_navigate: 0,
      data_extract: 0,
      form_submit: 0,
      content_edit: 0,
      information_query: 0,
      system_control: 0,
      task_management: 0,
      unknown: 0
    };

    this.commandHistory.forEach(cmd => {
      patterns[cmd.intent]++;
    });

    return Object.entries(patterns)
      .map(([intent, count]) => ({ intent: intent as CommandIntent, count }))
      .sort((a, b) => b.count - a.count);
  }

  public clearHistory(): void {
    this.commandHistory = [];
  }
}

export const nlpProcessor = NLPProcessor.getInstance();
