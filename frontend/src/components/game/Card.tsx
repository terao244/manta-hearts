'use client';

import React from 'react';
import type { CardProps } from '@/types';

export const Card: React.FC<CardProps> = ({
  card,
  isPlayable = true,
  isSelected = false,
  onClick,
  onHover,
  size = 'medium'
}) => {
  const { suit, rank, pointValue } = card;

  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case 'HEARTS': return '♥';
      case 'DIAMONDS': return '♦';
      case 'CLUBS': return '♣';
      case 'SPADES': return '♠';
      default: return '';
    }
  };

  const getRankDisplay = (rank: string): string => {
    switch (rank) {
      case 'ACE': return 'A';
      case 'JACK': return 'J';
      case 'QUEEN': return 'Q';
      case 'KING': return 'K';
      case 'TWO': return '2';
      case 'THREE': return '3';
      case 'FOUR': return '4';
      case 'FIVE': return '5';
      case 'SIX': return '6';
      case 'SEVEN': return '7';
      case 'EIGHT': return '8';
      case 'NINE': return '9';
      case 'TEN': return '10';
      default: return '';
    }
  };

  const getSuitColor = (suit: string): string => {
    return suit === 'HEARTS' || suit === 'DIAMONDS' ? 'text-red-600' : 'text-black';
  };

  const getCardSize = (size: string) => {
    switch (size) {
      case 'small': return 'w-12 h-16 text-xs';
      case 'large': return 'w-20 h-28 text-lg';
      case 'medium':
      default: return 'w-16 h-24 text-sm';
    }
  };

  const getCardBorder = () => {
    if (suit === 'SPADES' && rank === 'QUEEN') {
      return 'border-red-500 border-2';
    }
    if (suit === 'HEARTS') {
      return 'border-red-400';
    }
    return 'border-gray-300';
  };

  const getCardClasses = () => {
    const baseClasses = [
      'relative',
      'bg-white',
      'rounded-lg',
      'shadow-md',
      'border',
      'flex',
      'flex-col',
      'justify-between',
      'font-bold',
      'select-none',
      'transition-all',
      'duration-200',
      getCardSize(size),
      getCardBorder()
    ];

    if (onClick && isPlayable) {
      baseClasses.push(
        'cursor-pointer',
        'hover:shadow-lg',
        'hover:scale-105',
        'active:scale-95'
      );
    }

    if (!isPlayable) {
      baseClasses.push('opacity-50', 'cursor-not-allowed');
    }

    if (isSelected) {
      baseClasses.push('ring-2', 'ring-blue-500', 'ring-offset-2');
    }

    return baseClasses.join(' ');
  };

  const handleClick = () => {
    if (onClick && isPlayable) {
      onClick();
    }
  };

  const handleMouseEnter = () => {
    if (onHover) {
      onHover();
    }
  };

  const CardElement = onClick ? 'button' : 'div';

  return (
    <CardElement
      data-testid="card"
      className={getCardClasses()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={onClick ? !isPlayable : undefined}
      {...(onClick && { role: 'button' })}
    >
      {/* 左上のランクとスート */}
      <div className={`p-1 leading-none ${getSuitColor(suit)}`}>
        <div className="text-center">
          <div>{getRankDisplay(rank)}</div>
          <div>{getSuitSymbol(suit)}</div>
        </div>
      </div>

      {/* 中央のスート */}
      <div className={`flex-1 flex items-center justify-center ${getSuitColor(suit)}`}>
        <span className="text-2xl">{getSuitSymbol(suit)}</span>
      </div>

      {/* 右下のランクとスート（上下反転） */}
      <div className={`p-1 leading-none transform rotate-180 ${getSuitColor(suit)}`}>
        <div className="text-center">
          <div>{getRankDisplay(rank)}</div>
          <div>{getSuitSymbol(suit)}</div>
        </div>
      </div>

      {/* ポイント値表示（デバッグ用、後で削除可能） */}
      {pointValue > 0 && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center -mt-1 -mr-1">
          {pointValue}
        </div>
      )}
    </CardElement>
  );
};