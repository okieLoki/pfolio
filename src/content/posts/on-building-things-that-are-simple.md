---
title: On building things that are simple
date: 2026-09-10
excerpt: There's a certain beauty in software that does one thing well. I've been thinking about why most tools feel bloated, and what it would mean to go the other direction.
---

There's a certain beauty in software that does one thing well. I've been thinking about why most tools feel bloated, and what it would mean to go the other direction.

Every app I open these days wants to be my operating system. My note-taking app wants to manage my tasks, my calendar, my habits, and my relationships. My music player wants to be a social network. My text editor wants to be an IDE, a writing platform, and a second brain.

I get it. Features sell. But there's a cost to all of this, and I don't mean the subscription price.

## The weight of features

Every feature adds cognitive load. When you open a tool and see twenty buttons, you have to figure out which three are relevant to what you're trying to do. The rest is noise. And noise accumulates.

Simple tools respect your attention. They assume you know what you want to do, and they get out of the way.

## What simple actually means

Simple doesn't mean limited. It means focused. A good example is `grep` — it finds text in files. That's it. But it does it so well that it's survived forty years of computing without becoming "more."

Another example: the Unix philosophy. Small programs that do one thing well, connected by pipes. Each tool is simple. The power comes from combination.

> Simplicity is prerequisite for reliability. — Edsger Dijkstra

## Building with constraint

I've started asking myself one question before adding any feature: "Does this help the user do the thing they came here to do?" If the answer is no, it doesn't ship.

This is harder than it sounds. You have to know what your tool is actually for. You have to resist the urge to solve every edge case. You have to trust that your users are capable of figuring things out.

But the result is software that feels lighter. Software that doesn't exhaust you. Software you actually want to use.

I don't always succeed at this. But I keep trying.
