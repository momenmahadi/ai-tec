/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ActiveKey {
  code: string;
  credits: number;
  columnName?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type AppView = 'landing' | 'tool';

export type ToolView = 'activate' | 'builder' | 'quiz';
