import { describe, it, expect } from 'vitest';
import { matchRoute, buildViewHash, ROUTES } from '../../js/pure.js';

describe('matchRoute', () => {
  it('matches /home', () => expect(matchRoute('#/home')).toMatchObject({ name: 'home' }));
  it('matches empty hash as /home', () => expect(matchRoute('#')).toMatchObject({ name: 'home' }));
  it('matches /dashboard/:deck', () => {
    expect(matchRoute('#/dashboard/major')).toEqual({ name: 'dashboard', deck: 'major' });
  });
  it('matches /quiz/:deck', () => {
    expect(matchRoute('#/quiz/sem3')).toEqual({ name: 'quiz', deck: 'sem3' });
  });
  it('matches /stats', () => expect(matchRoute('#/stats')).toMatchObject({ name: 'stats' }));
  it('matches /editor/:deck', () => {
    expect(matchRoute('#/editor/pao')).toEqual({ name: 'editor', deck: 'pao' });
  });
  it('matches /preview/:deck', () => {
    expect(matchRoute('#/preview/binary')).toEqual({ name: 'preview', deck: 'binary' });
  });
  it('returns null for unknown path', () => expect(matchRoute('#/unknown/path')).toBeNull());
  it('handles hyphenated deck names', () => {
    expect(matchRoute('#/quiz/peg-matrix')?.deck).toBe('peg-matrix');
  });
  it('returns null for /dashboard without deck', () => expect(matchRoute('#/dashboard')).toBeNull());
  it('deck is null for routes without a param', () => {
    expect(matchRoute('#/home').deck).toBeNull();
    expect(matchRoute('#/stats').deck).toBeNull();
  });
  it('covers every route in ROUTES', () => {
    const samples = {
      home:      '#/home',
      dashboard: '#/dashboard/major',
      quiz:      '#/quiz/major',
      stats:     '#/stats',
      editor:    '#/editor/major',
      preview:   '#/preview/major',
    };
    for (const route of ROUTES) {
      expect(matchRoute(samples[route.name])?.name).toBe(route.name);
    }
  });
});

describe('buildViewHash', () => {
  it('maps home → /home', () => expect(buildViewHash('home', '')).toBe('/home'));
  it('maps dashboard + deck → /dashboard/:deck', () => expect(buildViewHash('dashboard', 'major')).toBe('/dashboard/major'));
  it('maps quiz-config → /quiz/:deck', () => expect(buildViewHash('quiz-config', 'sem3')).toBe('/quiz/sem3'));
  it('maps quiz → /quiz/:deck', () => expect(buildViewHash('quiz', 'major')).toBe('/quiz/major'));
  it('maps stats → /stats', () => expect(buildViewHash('stats', '')).toBe('/stats'));
  it('maps editor + deck → /editor/:deck', () => expect(buildViewHash('editor', 'pao')).toBe('/editor/pao'));
  it('maps preview + deck → /preview/:deck', () => expect(buildViewHash('preview', 'binary')).toBe('/preview/binary'));
  it('maps unknown view → /viewName', () => expect(buildViewHash('unknown', '')).toBe('/unknown'));
  it('omits deck segment when deck is empty for deck-views', () => {
    expect(buildViewHash('dashboard', '')).toBe('/dashboard');
  });
});
