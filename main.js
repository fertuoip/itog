"use strict";

const {
  Warrior,
  Mage,
  play,
} = require("./rpg.js");

const players = [
  new Warrior(0, "Алёша Попович"),
  new Mage(5, "Гендальф"),
];

const winner = play(players);

if (winner) {
  console.log(`\nПобедитель: ${winner.name}`);
  console.log(`Здоровье: ${winner.life.toFixed(2)}`);
} else {
  console.log("Нет живых участников.");
}