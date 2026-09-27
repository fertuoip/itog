"use strict";

const {
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
} = require("./rpg");

beforeEach(() => {
  Player.logger = null;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Оружие", () => {
  test.each([
    [Arm, "Рука", 1, Infinity, 1],
    [Bow, "Лук", 10, 200, 3],
    [Sword, "Меч", 25, 500, 1],
    [Knife, "Нож", 5, 300, 1],
    [Staff, "Посох", 8, 300, 2],
    [LongBow, "Длинный лук", 15, 200, 4],
    [Axe, "Секира", 27, 800, 1],
    [StormStaff, "Посох Бури", 10, 300, 3],
  ])(
    "%p: характеристики",
    (Type, name, attack, durability, range) => {
      expect(new Type()).toMatchObject({
        name,
        attack,
        durability,
        initDurability: durability,
        range,
      });
    },
  );

  test("износ, порог 30% и поломка", () => {
    const weapon = new Weapon("Тест", 20, 100, 1);

    weapon.takeDamage(70);
    expect(weapon.getDamage()).toBe(20);
    expect(weapon.isBroken()).toBe(false);

    weapon.takeDamage(1);
    expect(weapon.getDamage()).toBe(10);

    weapon.takeDamage(100);
    expect(weapon.durability).toBe(0);
    expect(weapon.getDamage()).toBe(0);
    expect(weapon.isBroken()).toBe(true);
  });

  test("рука не изнашивается", () => {
    const arm = new Arm();

    arm.takeDamage(Infinity);

    expect(arm.durability).toBe(Infinity);
    expect(arm.getDamage()).toBe(1);
  });
});

describe("Player", () => {
  test("начальные свойства", () => {
    const player = new Player(10, "Игрок");

    expect(player).toMatchObject({
      life: 100,
      magic: 20,
      speed: 1,
      attack: 10,
      agility: 5,
      luck: 10,
      description: "Игрок",
      position: 10,
      name: "Игрок",
    });

    expect(player.weapon).toBeInstanceOf(Arm);
  });

  test("удача и урон", () => {
    const player = new Player(0, "Игрок");

    jest.spyOn(Math, "random").mockReturnValue(0.4);

    expect(player.getLuck()).toBeCloseTo(0.5);
    expect(player.getDamage(1)).toBeCloseTo(5.5);
    expect(player.getDamage(2)).toBe(0);
    expect(player.getDamage(0)).toBe(0);
  });

  test("здоровье и смерть", () => {
    const player = new Player(0, "Игрок");

    player.takeDamage(10);
    expect(player.life).toBe(90);

    player.takeDamage(200);
    expect(player.life).toBe(0);
    expect(player.isDead()).toBe(true);
  });

  test("перемещение", () => {
    const player = new Warrior(6, "Воин");

    player.moveLeft(5);
    expect(player.position).toBe(4);

    player.moveRight(2);
    expect(player.position).toBe(6);

    player.move(1);
    expect(player.position).toBe(7);

    player.move(-10);
    expect(player.position).toBe(5);
  });

  test("пороги блока и уклонения", () => {
    const player = new Player(0, "Игрок");
    const luck = jest.spyOn(player, "getLuck");

    luck.mockReturnValue(0.9);
    expect(player.isAttackBlocked()).toBe(false);

    luck.mockReturnValue(0.95);
    expect(player.isAttackBlocked()).toBe(true);
    expect(player.dodged()).toBe(true);

    luck.mockReturnValue(0.5);
    expect(player.dodged()).toBe(false);
  });

  test("блок и смена оружия", () => {
    const player = new Warrior(0, "Воин");

    jest.spyOn(player, "isAttackBlocked").mockReturnValue(true);
    const dodge = jest.spyOn(player, "dodged");

    player.takeAttack(500);

    expect(player.life).toBe(120);
    expect(player.weapon).toBeInstanceOf(Knife);
    expect(dodge).not.toHaveBeenCalled();

    player.takeAttack(300);
    expect(player.weapon).toBeInstanceOf(Arm);

    player.takeAttack(1000);
    expect(player.weapon).toBeInstanceOf(Arm);
  });

  test("уклонение и попадание", () => {
    const player = new Player(0, "Игрок");

    jest.spyOn(player, "isAttackBlocked").mockReturnValue(false);
    const dodge = jest.spyOn(player, "dodged").mockReturnValue(true);

    player.takeAttack(20);
    expect(player.life).toBe(100);

    dodge.mockReturnValue(false);
    player.takeAttack(20);
    expect(player.life).toBe(80);
  });

  test("вывод сообщений", () => {
    Player.logger = jest.fn();

    new Player(0, "Тест").takeDamage(5);

    expect(Player.logger).toHaveBeenCalledWith(
      expect.stringContaining("Тест"),
    );
  });
});

describe("Особенности классов", () => {
  test("воин поглощает урон маной", () => {
    const warrior = new Warrior(0, "Воин");

    jest.spyOn(warrior, "getLuck").mockReturnValue(0.9);

    warrior.takeDamage(70);
    expect(warrior.life).toBe(50);

    warrior.takeDamage(5);
    expect(warrior.life).toBe(50);
    expect(warrior.magic).toBe(15);

    warrior.takeDamage(20);
    expect(warrior.life).toBe(45);
    expect(warrior.magic).toBe(0);

    warrior.takeDamage(5);
    expect(warrior.life).toBe(40);
  });

  test("защита воина не срабатывает без удачи", () => {
    const warrior = new Warrior(0, "Воин");
    warrior.life = 50;

    jest.spyOn(warrior, "getLuck").mockReturnValue(0.8);

    warrior.takeDamage(10);

    expect(warrior.life).toBe(40);
    expect(warrior.magic).toBe(20);
  });

  test("урон лучника зависит от расстояния", () => {
    const archer = new Archer(0, "Лучник");

    jest.spyOn(archer, "getLuck").mockReturnValue(0.5);

    expect(archer.getDamage(1)).toBe(2.5);
    expect(archer.getDamage(3)).toBe(7.5);
    expect(archer.getDamage(4)).toBe(0);
  });

  test("маг уменьшает урон при мане выше 50%", () => {
    const mage = new Mage(0, "Маг");

    for (const damage of [50, 20, 10, 20, 20]) {
      mage.takeDamage(damage);
    }

    expect(mage.life).toBe(10);
    expect(mage.magic).toBe(40);

    mage.takeDamage(10);
    expect(mage.isDead()).toBe(true);
  });

  test("гном уменьшает шестой удар", () => {
    const dwarf = new Dwarf(0, "Гном");

    jest.spyOn(dwarf, "getLuck").mockReturnValue(0.6);

    for (let i = 0; i < 6; i += 1) {
      dwarf.takeDamage(2);
    }

    expect(dwarf.life).toBe(119);
    expect(dwarf.receivedHits).toBe(6);
    expect(dwarf.weapon).toBeInstanceOf(Axe);
  });

  test("характеристики арбалетчика", () => {
    const player = new Crossbowman(0, "Арбалетчик");

    expect(player).toMatchObject({
      life: 85,
      magic: 35,
      attack: 8,
      agility: 20,
      luck: 15,
    });

    expect(player.weapon).toBeInstanceOf(LongBow);
  });

  test("демиург усиливает урон", () => {
    const player = new Demiurge(0, "Демиург");
    const luck = jest.spyOn(player, "getLuck").mockReturnValue(0.8);

    expect(player.getDamage(1)).toBeCloseTo(19.2);
    expect(player.getDamage(4)).toBe(0);

    player.magic = 0;
    expect(player.getDamage(1)).toBeCloseTo(12.8);

    player.magic = 120;
    luck.mockReturnValue(0.5);
    expect(player.getDamage(1)).toBe(8);
  });

  test("порог маны демиурга равен 60", () => {
    const player = new Demiurge(0, "Демиург");
    player.magic = 60;

    player.takeDamage(10);

    expect(player.life).toBe(70);
    expect(player.magic).toBe(60);
  });
});

describe("Атаки и ходы", () => {
  test("нельзя атаковать слишком далёкую цель", () => {
    const player = new Warrior(0, "Воин");
    const enemy = new Player(3, "Враг");
    const attack = jest.spyOn(enemy, "takeAttack");

    player.tryAttack(enemy);

    expect(attack).not.toHaveBeenCalled();
    expect(player.weapon.durability).toBe(500);
  });

  test("атака изнашивает оружие и наносит урон", () => {
    const player = new Warrior(0, "Воин");
    const enemy = new Player(1, "Враг");

    jest.spyOn(player, "getLuck").mockReturnValue(0.5);
    const attack = jest.spyOn(enemy, "takeAttack")
      .mockImplementation(() => {});

    player.tryAttack(enemy);

    expect(player.weapon.durability).toBe(495);
    expect(attack).toHaveBeenCalledWith(17.5);
  });

  test("совпадение позиций даёт двойной удар", () => {
    const player = new Warrior(0, "Воин");
    const enemy = new Player(0, "Враг");

    jest.spyOn(player, "getLuck").mockReturnValue(0.5);
    const attack = jest.spyOn(enemy, "takeAttack")
      .mockImplementation(() => {});

    player.tryAttack(enemy);

    expect(enemy.position).toBe(1);
    expect(attack).toHaveBeenCalledTimes(1);
    expect(attack).toHaveBeenCalledWith(35);
  });

  test("сломанное при атаке оружие заменяется", () => {
    const player = new Warrior(0, "Воин");
    const enemy = new Player(1, "Враг");
    player.weapon.durability = 1;

    jest.spyOn(player, "getLuck").mockReturnValue(0.5);
    jest.spyOn(enemy, "takeAttack").mockImplementation(() => {});

    player.tryAttack(enemy);

    expect(player.weapon).toBeInstanceOf(Knife);
  });

  test("chooseEnemy выбирает самого слабого живого врага", () => {
    const player = new Player(0, "Игрок");
    const strong = new Player(1, "Сильный");
    const weak = new Player(2, "Слабый");
    const dead = new Player(3, "Мёртвый");

    weak.life = 20;
    dead.life = 0;

    expect(
      player.chooseEnemy([player, strong, dead, weak]),
    ).toBe(weak);

    expect(
      player.chooseEnemy([player, dead]),
    ).toBeNull();
  });

  test("turn: выбор → движение → атака", () => {
    const player = new Player(0, "Игрок");
    const enemy = new Player(3, "Враг");
    const order = [];

    jest.spyOn(player, "chooseEnemy").mockImplementation(() => {
      order.push("choose");
      return enemy;
    });

    jest.spyOn(player, "moveToEnemy").mockImplementation(() => {
      order.push("move");
    });

    jest.spyOn(player, "tryAttack").mockImplementation(() => {
      order.push("attack");
    });

    player.turn([player, enemy]);

    expect(order).toEqual(["choose", "move", "attack"]);
  });

  test("движение к противнику", () => {
    const player = new Warrior(0, "Воин");
    const enemy = new Player(5, "Враг");

    player.moveToEnemy(enemy);
    expect(player.position).toBe(2);

    player.turn([player]);
    expect(player.position).toBe(2);
  });

  test("мёртвый игрок не действует", () => {
    const player = new Player(0, "Игрок");
    const enemy = new Player(1, "Враг");
    player.life = 0;

    const choose = jest.spyOn(player, "chooseEnemy");
    const attack = jest.spyOn(enemy, "takeAttack");

    player.turn([player, enemy]);
    player.tryAttack(enemy);
    player.takeAttack(10);

    expect(choose).not.toHaveBeenCalled();
    expect(attack).not.toHaveBeenCalled();
    expect(player.life).toBe(0);
  });
});

describe("play", () => {
  test("пустое поле", () => {
    expect(play([])).toBeNull();
  });

  test("единственный игрок побеждает", () => {
    const player = new Player(0, "Один");

    expect(play([player])).toBe(player);
  });

  test("определяется победитель боя", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.4);

    const warrior = new Warrior(0, "Воин");
    const enemy = new Player(1, "Враг");
    enemy.life = 1;

    Player.logger = jest.fn();

    expect(play([warrior, enemy])).toBe(warrior);
    expect(enemy.isDead()).toBe(true);
    expect(Player.logger).toHaveBeenCalled();
  });

  test("ограничение количества раундов", () => {
    const a = new Player(0, "A");
    const b = new Player(1, "B");

    jest.spyOn(a, "turn").mockImplementation(() => {});
    jest.spyOn(b, "turn").mockImplementation(() => {});

    expect(() => play([a, b], { maxRounds: 2 }))
      .toThrow("Бой не завершился");
  });

  test("неправильное ограничение раундов", () => {
    expect(() => play([], { maxRounds: 0 }))
      .toThrow(RangeError);
  });
});