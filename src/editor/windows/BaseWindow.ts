
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { Engine } from '../../engine';

export abstract class BaseWindow extends LitElement {
  @property({ attribute: false })
  engine?: Engine;

  abstract title: string;
}
