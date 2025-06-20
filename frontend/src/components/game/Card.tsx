'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { CardProps } from '@/types';
import { getCardImagePath } from '@/utils/cardImages';

export const Card: React.FC<CardProps> = ({
  card,
  isPlayable = true,
  isSelected = false,
  onClick,
  onHover,
  size = 'medium'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);
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
      case 'small': return { container: 'w-12 h-16', image: { width: 48, height: 64 } };
      case 'large': return { container: 'w-20 h-28', image: { width: 80, height: 112 } };
      case 'medium':
      default: return { container: 'w-20 h-28', image: { width: 80, height: 112 } };
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
    const cardSize = getCardSize(size);
    const baseClasses = [
      'relative',
      'bg-white',
      'rounded-lg',
      'shadow-md',
      'border',
      'flex',
      'items-center',
      'justify-center',
      'select-none',
      'transition-all',
      'duration-200',
      'overflow-hidden',
      cardSize.container,
      getCardBorder()
    ];

    if (onClick && isPlayable) {
      baseClasses.push(
        'cursor-pointer',
        'hover:shadow-2xl',
        'hover:shadow-green-400/60',
        'hover:scale-110',
        'hover:z-20',
        'hover:rotate-2',
        'active:scale-95',
        'active:rotate-0',
        'ring-2',
        'ring-green-400',
        'ring-opacity-60',
        'transition-all',
        'duration-300'
      );
    } else if (onClick && !isPlayable) {
      baseClasses.push(
        'cursor-not-allowed',
        'hover:shadow-md',
        'hover:shadow-red-400/30',
        'hover:scale-102',
        'transition-all',
        'duration-200'
      );
    }

    if (!isPlayable) {
      baseClasses.push('opacity-60', 'brightness-75', 'contrast-75');
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
    setShowTooltip(true);
    if (onHover) {
      onHover();
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const getTooltipContent = (): string => {
    const suitName = { 'SPADES': 'スペード', 'HEARTS': 'ハート', 'DIAMONDS': 'ダイヤ', 'CLUBS': 'クラブ' }[suit];
    const rankName = { 
      'ACE': 'エース', 'TWO': '2', 'THREE': '3', 'FOUR': '4', 'FIVE': '5', 'SIX': '6', 
      'SEVEN': '7', 'EIGHT': '8', 'NINE': '9', 'TEN': '10', 'JACK': 'ジャック', 
      'QUEEN': 'クイーン', 'KING': 'キング' 
    }[rank];
    
    let tooltip = `${suitName}の${rankName}`;
    if (pointValue > 0) {
      tooltip += ` (${pointValue}点)`;
    }
    if (!isPlayable && onClick) {
      tooltip += ' - プレイできません';
    } else if (isPlayable && onClick) {
      tooltip += ' - クリックしてプレイ';
    }
    return tooltip;
  };

  const CardElement = onClick ? 'button' : 'div';
  const cardSize = getCardSize(size);

  const renderCardContent = () => {
    if (imageError) {
      // 画像読み込みエラー時は従来のテキスト表示にフォールバック
      return (
        <>
          {/* 左上のランクとスート */}
          <div className={`absolute top-1 left-1 text-xs leading-none ${getSuitColor(suit)}`}>
            <div className="text-center">
              <div>{getRankDisplay(rank)}</div>
              <div>{getSuitSymbol(suit)}</div>
            </div>
          </div>

          {/* 中央のスート */}
          <div className={`flex items-center justify-center ${getSuitColor(suit)}`}>
            <span className="text-2xl">{getSuitSymbol(suit)}</span>
          </div>

          {/* 右下のランクとスート（上下反転） */}
          <div className={`absolute bottom-1 right-1 text-xs leading-none transform rotate-180 ${getSuitColor(suit)}`}>
            <div className="text-center">
              <div>{getRankDisplay(rank)}</div>
              <div>{getSuitSymbol(suit)}</div>
            </div>
          </div>
        </>
      );
    }

    try {
      const imagePath = getCardImagePath(suit, rank);
      return (
        <Image
          src={imagePath}
          alt={`${suit} ${rank}`}
          width={cardSize.image.width}
          height={cardSize.image.height}
          className="object-contain"
          onError={() => setImageError(true)}
        />
      );
    } catch {
      setImageError(true);
      return null;
    }
  };

  return (
    <div className="relative inline-block">
      <CardElement
        data-testid="card"
        className={getCardClasses()}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={onClick ? !isPlayable : undefined}
        {...(onClick && { role: 'button' })}
      >
        {renderCardContent()}

        {/* ポイント値表示（デバッグ用、後で削除可能） */}
        {pointValue > 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center -mt-1 -mr-1 z-10">
            {pointValue}
          </div>
        )}
      </CardElement>

      {/* ツールチップ */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {getTooltipContent()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};