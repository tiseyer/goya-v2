'use client';

import React from 'react';
import { FlowElement } from '@/lib/flows/types';

import InfoTextRenderer from './InfoTextRenderer';
import ShortTextRenderer from './ShortTextRenderer';
import LongTextRenderer from './LongTextRenderer';
import SingleChoiceRenderer from './SingleChoiceRenderer';
import MultiChoiceRenderer from './MultiChoiceRenderer';
import DropdownRenderer from './DropdownRenderer';
import ImageUploadRenderer from './ImageUploadRenderer';
import ImageRenderer from './ImageRenderer';
import VideoRenderer from './VideoRenderer';

export interface ElementRendererProps {
  element: FlowElement;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

type RendererMap = Record<FlowElement['type'], React.ComponentType<ElementRendererProps>>;

const renderers: RendererMap = {
  info_text: InfoTextRenderer as React.ComponentType<ElementRendererProps>,
  short_text: ShortTextRenderer as React.ComponentType<ElementRendererProps>,
  long_text: LongTextRenderer as React.ComponentType<ElementRendererProps>,
  single_choice: SingleChoiceRenderer as React.ComponentType<ElementRendererProps>,
  multi_choice: MultiChoiceRenderer as React.ComponentType<ElementRendererProps>,
  dropdown: DropdownRenderer as React.ComponentType<ElementRendererProps>,
  image_upload: ImageUploadRenderer as React.ComponentType<ElementRendererProps>,
  image: ImageRenderer as React.ComponentType<ElementRendererProps>,
  video: VideoRenderer as React.ComponentType<ElementRendererProps>,
};

export function ElementRenderer({ element, value, onChange, disabled }: ElementRendererProps) {
  const Renderer = renderers[element.type];
  if (!Renderer) return null;
  return React.createElement(Renderer, { element, value, onChange, disabled });
}
