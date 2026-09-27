"use strict";

// ======================================================
// ОРУЖИЕ
// ======================================================

class Weapon {
  constructor(name, attack, durability, range) {
    this.name = name;
    this.attack = attack;
    this.durability = durability;
    this.initDurability = durability;
    this.range = range;
  }

  takeDamage(damage) {
    // Руки не изнашиваются.
    if (this.durability === Infinity) {
      return;
    }

    this.durability = Math.max(
      0,
      this.durability - Math.max(0, damage),
    );
  }

  getDamage() {
    if (this.durability <= 0) {
      return 0;
    }

    if (this.durability >= this.initDurability * 0.3) {
      return this.attack;
    }

    return this.attack / 2;
  }

  isBroken() {
    return this.durability === 0;
  }
}

class Arm extends Weapon {
  constructor() {
    super("Рука", 1, Infinity, 1);
  }
}

class Bow extends Weapon {
  constructor() {
    super("Лук", 10, 200, 3);
  }
}

class Sword extends Weapon {
  constructor() {
    super("Меч", 25, 500, 1);
  }
}

class Knife extends Weapon {
  constructor() {
    super("Нож", 5, 300, 1);
  }
}

class Staff extends Weapon {
  constructor() {
    super("Посох", 8, 300, 2);
  }
}

class LongBow extends Bow {
  constructor() {
    super();

    this.name = "Длинный лук";
    this.attack = 15;
    this.range = 4;
  }
}

class Axe extends Sword {
  constructor() {
    super();

    this.name = "Секира";
    this.attack = 27;
    this.durability = 800;
    this.initDurability = 800;
  }
}

class StormStaff extends Staff {
  constructor() {
    super();

    this.name = "Посох Бури";
    this.attack = 10;
    this.range = 3;
  }
}

// ======================================================
// БАЗОВЫЙ ИГРОК
// ======================================================

class Player {
  constructor(position, name) {
    this.life = 100;
    this.magic = 20;
    this.speed = 1;
    this.attack = 10;
    this.agility = 5;
    this.luck = 10;
    this.description = "Игрок";
    this.weapon = new Arm();

    this.position = position;
    this.name = name;

    // Начальные значения нужны для расчёта порогов 50%.
    this.initLife = this.life;
    this.initMagic = this.magic;
  }

  log(message) {
    if (typeof Player.logger === "function") {
      Player.logger(
        `[${this.description} ${this.name}] ${message}`,
      );
    }
  }

  getLuck() {
    return (Math.random() * 100 + this.luck) / 100;
  }

  getDamage(distance) {
    if (distance <= 0 || distance > this.weapon.range) {
      return 0;
    }

    return (
      (this.attack + this.weapon.getDamage()) *
      this.getLuck() /
      distance
    );
  }

  takeDamage(damage) {
    const previousLife = this.life;

    this.life = Math.max(
      0,
      this.life - Math.max(0, damage),
    );

    this.log(
      `получает ${(previousLife - this.life).toFixed(2)} урона. ` +
      `Здоровье: ${this.life.toFixed(2)}`,
    );

    if (previousLife > 0 && this.isDead()) {
      this.log("погибает");
    }
  }

  isDead() {
    return this.life === 0;
  }

  moveLeft(distance) {
    this.position -= Math.min(
      Math.abs(distance),
      this.speed,
    );
  }

  moveRight(distance) {
    this.position += Math.min(
      Math.abs(distance),
      this.speed,
    );
  }

  move(distance) {
    if (distance < 0) {
      this.moveLeft(distance);
    } else {
      this.moveRight(distance);
    }
  }

  isAttackBlocked() {
    return this.getLuck() > (100 - this.luck) / 100;
  }

  dodged() {
    return (
      this.getLuck() >
      (100 - this.agility - this.speed * 3) / 100
    );
  }

  takeAttack(damage) {
    if (this.isDead()) {
      return;
    }

    // Сначала проверяется блок.
    if (this.isAttackBlocked()) {
      this.weapon.takeDamage(damage);

      this.log(
        `блокирует удар оружием «${this.weapon.name}»`,
      );

      this.checkWeapon();
      return;
    }

    // Затем проверяется уклонение.
    if (this.dodged()) {
      this.log("уклоняется от удара");
      return;
    }

    // Если защиты не сработали, урон получает персонаж.
    this.takeDamage(damage);
  }

  checkWeapon() {
    if (!this.weapon.isBroken()) {
      return;
    }

    // Любое основное оружие → Нож → Рука.
    if (this.weapon instanceof Knife) {
      this.weapon = new Arm();
    } else {
      this.weapon = new Knife();
    }

    this.log(
      `меняет сломанное оружие на «${this.weapon.name}»`,
    );
  }

  tryAttack(enemy) {
    if (
      !enemy ||
      enemy === this ||
      this.isDead() ||
      enemy.isDead()
    ) {
      return;
    }

    this.checkWeapon();

    const samePosition = this.position === enemy.position;

    // При совпадении позиций используем 1,
    // чтобы не делить урон на ноль.
    const distance = Math.max(
      1,
      Math.abs(this.position - enemy.position),
    );

    if (distance > this.weapon.range) {
      this.log(`не достаёт до ${enemy.name}`);
      return;
    }

    // По условию сначала учитывается износ оружия.
    this.weapon.takeDamage(10 * this.getLuck());

    let damage = this.getDamage(distance);

    if (samePosition) {
      damage *= 2;
      enemy.position += 1;

      this.log(
        `отбрасывает ${enemy.name} на позицию ${enemy.position}`,
      );
    }

    this.log(
      `атакует ${enemy.name}. Сила удара: ${damage.toFixed(2)}`,
    );

    enemy.takeAttack(damage);

    this.checkWeapon();
  }

  chooseEnemy(players) {
    let selected = null;

    for (const player of players) {
      if (player === this || player.isDead()) {
        continue;
      }

      // Выбираем живого противника с наименьшим здоровьем.
      if (selected === null || player.life < selected.life) {
        selected = player;
      }
    }

    return selected;
  }

  moveToEnemy(enemy) {
    if (!enemy) {
      return;
    }

    const previousPosition = this.position;

    this.move(enemy.position - this.position);

    this.log(
      `перемещается: ${previousPosition} → ${this.position}`,
    );
  }

  turn(players) {
    if (this.isDead()) {
      return;
    }

    // Порядок действий важен:
    // выбор противника → движение → атака.
    const enemy = this.chooseEnemy(players);

    if (!enemy) {
      return;
    }

    this.moveToEnemy(enemy);
    this.tryAttack(enemy);
  }
}

// Для отключения сообщений: Player.logger = null.
Player.logger = console.log;

// ======================================================
// ОБЫЧНЫЕ ПЕРСОНАЖИ
// ======================================================

class Warrior extends Player {
  constructor(position, name) {
    super(position, name);

    this.life = 120;
    this.speed = 2;
    this.description = "Воин";
    this.weapon = new Sword();

    this.initLife = this.life;
  }

  takeDamage(damage) {
    damage = Math.max(0, damage);

    if (
      this.life < this.initLife / 2 &&
      this.magic > 0 &&
      this.getLuck() > 0.8
    ) {
      const absorbedDamage = Math.min(
        this.magic,
        damage,
      );

      this.magic -= absorbedDamage;
      damage -= absorbedDamage;

      this.log(
        `поглощает маной ${absorbedDamage.toFixed(2)} урона. ` +
        `Мана: ${this.magic.toFixed(2)}`,
      );
    }

    // Если маны не хватило, остаток урона получает здоровье.
    super.takeDamage(damage);
  }
}

class Archer extends Player {
  constructor(position, name) {
    super(position, name);

    this.life = 80;
    this.magic = 35;
    this.attack = 5;
    this.agility = 10;
    this.description = "Лучник";
    this.weapon = new Bow();

    this.initLife = this.life;
    this.initMagic = this.magic;
  }

  getDamage(distance) {
    if (distance <= 0 || distance > this.weapon.range) {
      return 0;
    }

    return (
      (this.attack + this.weapon.getDamage()) *
      this.getLuck() *
      distance /
      this.weapon.range
    );
  }
}

class Mage extends Player {
  constructor(position, name) {
    super(position, name);

    this.life = 70;
    this.magic = 100;
    this.attack = 5;
    this.agility = 8;
    this.description = "Маг";
    this.weapon = new Staff();

    this.initLife = this.life;
    this.initMagic = this.magic;
  }

  takeDamage(damage) {
    damage = Math.max(0, damage);

    if (
      damage > 0 &&
      this.magic > this.initMagic / 2
    ) {
      damage /= 2;
      this.magic = Math.max(0, this.magic - 12);

      this.log(
        `уменьшает урон магией вдвое. Мана: ${this.magic}`,
      );
    }

    super.takeDamage(damage);
  }
}

// ======================================================
// УЛУЧШЕННЫЕ ПЕРСОНАЖИ
// ======================================================

class Dwarf extends Warrior {
  constructor(position, name) {
    super(position, name);

    this.life = 130;
    this.attack = 15;
    this.luck = 20;
    this.description = "Гном";
    this.weapon = new Axe();

    this.initLife = this.life;
    this.receivedHits = 0;
  }

  takeDamage(damage) {
    this.receivedHits += 1;

    if (
      this.receivedHits % 6 === 0 &&
      this.getLuck() > 0.5
    ) {
      damage /= 2;
      this.log("уменьшает урон шестого удара вдвое");
    }

    super.takeDamage(damage);
  }
}

class Crossbowman extends Archer {
  constructor(position, name) {
    super(position, name);

    this.life = 85;
    this.attack = 8;
    this.agility = 20;
    this.luck = 15;
    this.description = "Арбалетчик";
    this.weapon = new LongBow();

    this.initLife = this.life;
  }
}

class Demiurge extends Mage {
  constructor(position, name) {
    super(position, name);

    this.life = 80;
    this.magic = 120;
    this.attack = 6;
    this.luck = 12;
    this.description = "Демиург";
    this.weapon = new StormStaff();

    this.initLife = this.life;
    this.initMagic = this.magic;
  }

  getDamage(distance) {
    const damage = super.getDamage(distance);

    if (
      damage > 0 &&
      this.magic > 0 &&
      this.getLuck() > 0.6
    ) {
      return damage * 1.5;
    }

    return damage;
  }
}

// ======================================================
// ПРОВЕДЕНИЕ БОЯ
// ======================================================

function play(players, { maxRounds = 10000 } = {}) {
  if (!Number.isInteger(maxRounds) || maxRounds < 1) {
    throw new RangeError(
      "maxRounds должен быть положительным целым числом",
    );
  }

  // Создаём новый массив, убираем повторы и погибших игроков.
  let alive = [...new Set(players)].filter(
    player => !player.isDead(),
  );

  for (let round = 1; alive.length > 1; round += 1) {
    if (round > maxRounds) {
      throw new Error(
        `Бой не завершился за ${maxRounds} раундов`,
      );
    }

    if (typeof Player.logger === "function") {
      Player.logger(`\n========== Раунд ${round} ==========`);
    }

    // Каждый живой игрок получает один ход за раунд.
    for (const player of [...alive]) {
      if (player.isDead()) {
        continue;
      }

      player.turn(alive);

      alive = alive.filter(
        candidate => !candidate.isDead(),
      );

      if (alive.length <= 1) {
        break;
      }
    }
  }

  const winner = alive[0] ?? null;

  if (winner) {
    winner.log("побеждает!");
  }

  return winner;
}

// Экспорт для использования в других файлах и тестах.
module.exports = {
  Weapon,
  Arm,
  Bow,
  Sword,
  Knife,
  Staff,
  LongBow,
  Axe,
  StormStaff,
  Player,
  Warrior,
  Archer,
  Mage,
  Dwarf,
  Crossbowman,
  Demiurge,
  play,
};