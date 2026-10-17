#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const COUNT = 400;
const FIRST = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda',
  'William','Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica',
  'Thomas','Sarah','Charles','Karen','Christopher','Nancy','Daniel','Lisa',
  'Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley',
  'Steven','Kimberly','Paul','Emily','Andrew','Donna','Joshua','Michelle'];
const LAST  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas',
  'Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris',
  'Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King',
  'Wright','Scott','Torres','Nguyen','Hill','Flores'];
const STATUSES = ['active','idle','offline','maintenance'];
const PLATE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rand  = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

function randomPlate() {
  const l = () => PLATE_LETTERS[randInt(0, 25)];
  return `${l()}${l()}-${randInt(1000, 9999)}-${l()}${l()}`;
}
function randomDriver() { return `${pick(FIRST)} ${pick(LAST)}`; }
function randomStatus() { return pick(STATUSES); }
function randomLat() { return +rand(24.5, 49.0).toFixed(6); }
function randomLng() { return +rand(-125.0, -66.0).toFixed(6); }

function generate() {
  const vehicles = [];
  const seen = new Set();
  let id = 1;
  while (vehicles.length < COUNT) {
    const v = {
      id,
      plate: randomPlate(),
      driver: randomDriver(),
      status: randomStatus(),
      lat: randomLat(),
      lng: randomLng(),
    };
    if (seen.has(v.plate)) continue;
    seen.add(v.plate);
    vehicles.push(v);
    id++;
  }
  return vehicles;
}

const out = path.join(__dirname, '..', 'vehicles.json');
fs.writeFileSync(out, JSON.stringify(generate(), null, 2) + '\n', 'utf8');
console.log(`Wrote ${COUNT} vehicles to ${out}`);