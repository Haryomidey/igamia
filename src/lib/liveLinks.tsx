import React from 'react';
import { Link } from 'react-router-dom';

const liveLinkPattern = /(https?:\/\/[^\s]+\/stream\?streamId=[^\s]+|\/stream\?streamId=[^\s]+)/gi;

export function extractLiveLink(message: string) {
  const match = message.match(liveLinkPattern);
  return match?.[0] ?? null;
}

export function renderMessageWithLiveLinks(message: string) {
  const matches = [...message.matchAll(liveLinkPattern)];
  if (!matches.length) {
    return message;
  }

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const [fullMatch] = match;
    const start = match.index ?? 0;
    const end = start + fullMatch.length;

    if (start > lastIndex) {
      nodes.push(message.slice(lastIndex, start));
    }

    let href = fullMatch;
    try {
      href = new URL(fullMatch).pathname + new URL(fullMatch).search;
    } catch {}

    nodes.push(
      <Link key={`${fullMatch}-${index}`} to={href} className="font-black text-brand-accent underline underline-offset-4">
        Open live
      </Link>,
    );
    lastIndex = end;
  });

  if (lastIndex < message.length) {
    nodes.push(message.slice(lastIndex));
  }

  return nodes;
}
