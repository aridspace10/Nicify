import readline from 'readline';

// Setup input and output for the game
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility functions
const askQuestion = (question) => {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer)));
};

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Game Classes
class Player {
  constructor(name) {
    this.name = name;
    this.hp = 100;
    this.attack = 10;
    this.gold = 0;
    this.inventory = [];
    this.level = 1;
    this.exp = 0;
    this.skills = [];
  }

  is_alive() {
    return this.hp > 0;
  }

  add_item(item) {
    this.inventory.push(item);
  }

  gainExp(amount) {
    this.exp += amount;
    if (this.exp >= this.level * 100) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.exp = 0;
    this.hp += 20;
    this.attack += 5;
    console.log("Congratulations! " + this.name + " has reached Level " + this.level + "!");
    console.log(`HP: ${this.hp}, Attack: ${this.attack}`);
  }

  addSkill(skill) {
    this.skills.push(skill);
    console.log(`${this.name} has learned a new skill: ${skill.name}!`);
  }
}

class Skill {
  constructor(name, description, effect) {
    this.name = name;
    this.description = description;
    this.effect = effect;
  }

  use(player, target) {
    this.effect(player, target);
  }
}

class Monster {
  constructor(name, hp, attack, expReward=50) {
    this.name = name;
    this.hp = hp;
    this.attack = attack;
    this.expReward = expReward;
  }

  isAlive() {
    return this.hp>0;
  }
}

class Room {
  constructor(description, monster = null, treasure = null, event = null) {
    this.description = description;
    this.monster = monster;
    this.treasure = treasure;
    this.event = event;
  }

  hasMonster() {
    return this.monster && this.monster.isAlive();
  }

  hasTreasure() {
    return this.treasure !== null;
  }

  triggerEvent(player) {
    if (this.event) {
      this.event(player);
    }
  }
}

// Game Logic
class Dungeon {
  constructor(player) {
    this.player = player;
    this.level = 1;
    this.rooms = this.generateRooms();
    this.currentRoomIndex = 0;
  }

  generateRooms() {
    const traps = (player) => {
      var damage = randomInt(5, 20);
      player.hp -= damage;
      console.log(`\nYou triggered a trap and took ${damage} damage!`);
    };

    return [
      new Room('A dark, damp room with cobwebs in the corners.'),
      new Room(
        'A room filled with gold coins glittering on the floor.',
        null,
        { name: 'Gold Coins', amount: 50 }
      ),
      new Room(
        'A room with a growling goblin!',
        new Monster('Goblin', 30, 5)
      ),
      new Room(
        'A mysterious room with a glowing sword on an altar.', null, {
          name: 'Glowing Sword',
          attack: 15,
        }),
      new Room(
        'A room with a terrifying dragon!',
        new Monster('Dragon', 100, 20, 200)
      ),
      new Room('A narrow hallway with pressure plates on the floor.', null, null, traps),
    ];
  }

  getCurrentRoom() {
    return this.rooms[this.currentRoomIndex];
  }

  moveToNextRoom() {
    if (this.currentRoomIndex < this.rooms.length - 1) {
      this.currentRoomIndex++;
      return true;
    }
    return false;
  }

  resetRooms() {
    this.rooms = this.generateRooms();
    this.currentRoomIndex = 0;
  }
}

// Shop System
class Shop {
  constructor(items) {
    this.items = items;
  }

  async visit(player) {
    console.log(`\nWelcome to the shop!`);
    console.log(`You have ${player.gold} gold.`);
    for (let i = 0; i < this.items.length; i++) {
      console.log(`${i + 1}. ${this.items[i].name} - ${this.items[i].cost} gold`);
    }
    console.log(`0. Leave shop.`);

    const choice = await askQuestion('What would you like to buy? ');
    const itemIndex = parseInt(choice) - 1;

    if (itemIndex >= 0 && itemIndex < this.items.length) {
      const item = this.items[itemIndex];
      if (player.gold >= item.cost) {
        player.gold -= item.cost;
        player.addItem(item);
        console.log(`You bought ${item.name}.`);
      } else {
        console.log(`You don't have enough gold to buy ${item.name}.`);
      }
    } else {
      console.log(`You leave the shop.`);
    }
  }
}

// Game Flow
async function gameLoop(player) {
  const dungeon = new Dungeon(player);
  const shop = new Shop([
    { name: 'Health Potion', cost: 30, effect: (player) => (player.hp += 50) },
    { name: 'Strength Elixir', cost: 50, effect: (player) => (player.attack += 5) },
  ]);

  console.log(`Welcome to the dungeon, ${player.name}!`);

  while (player.isAlive()) {
    const currentRoom = dungeon.getCurrentRoom();
    console.log(`\n${currentRoom.description}`);

    currentRoom.triggerEvent(player);

    if (!player.isAlive()) {
      console.log('You have perished in the dungeon. Game Over.');
      break;
    }

    // Handle monster encounter
    if (currentRoom.hasMonster()) {
      console.log(`You encounter a ${currentRoom.monster.name}!`);

      while (currentRoom.hasMonster() && player.isAlive()) {
        console.log(
          `\nYour HP: ${player.hp} | ${currentRoom.monster.name} HP: ${currentRoom.monster.hp}`
        );
        const action = await askQuestion('Do you want to (a)ttack or (r)un? ');

        if (action === 'a') {
          // Player attacks monster
          const damage = randomInt(5, player.attack);
          currentRoom.monster.hp -= damage;
          console.log(`You deal ${damage} damage to the ${currentRoom.monster.name}.`);

          // Monster retaliates
          if (currentRoom.hasMonster()) {
            const monsterDamage = randomInt(1, currentRoom.monster.attack);
            player.hp -= monsterDamage;
            console.log(
              `The ${currentRoom.monster.name} hits you for ${monsterDamage} damage.`
            );
          }
        } else if (action === 'r') {
          console.log('You run away to the previous room!');
          dungeon.currentRoomIndex--;
          break;
        } else {
          console.log('Invalid action!');
        }
      }

      if (!currentRoom.hasMonster()) {
        console.log(`You defeated the ${currentRoom.monster.name}!`);
        player.gainExp(currentRoom.monster.expReward);
      }
    }

    if (!player.isAlive()) {
      console.log('You have perished in the dungeon. Game Over.');
      break;
    }

    // Handle treasure
    if (currentRoom.hasTreasure()) {
      console.log(`You find ${currentRoom.treasure.name}!`);
      if (currentRoom.treasure.amount) {
        player.gold += currentRoom.treasure.amount;
        console.log(`You now have ${player.gold} gold.`);
      } else if (currentRoom.treasure.attack) {
        player.attack = currentRoom.treasure.attack;
        console.log(`Your attack power increases to ${player.attack}!`);
      }
      player.addItem(currentRoom.treasure);
      currentRoom.treasure = null;
    }

    // Visit shop if player wants
    const visitShop = await askQuestion('Do you want to visit the shop? (y/n) ');
    if (visitShop.toLowerCase() === 'y') {
      await shop.visit(player);
    }

    // Move to the next room
    const next = await askQuestion('Do you want to move to the next room? (y/n) ');
    if (next.toLowerCase() === 'y') {
      if (!dungeon.moveToNextRoom()) {
        console.log('You have cleared the dungeon! Congratulations!');
        break;
      }
    } else {
      console.log('You decide to stay in the current room.');
    }
  }

  rl.close();
}

// Start the game
(async () => {
  const name = await askQuestion('What is your name, adventurer? ');
  const player = new Player(name);
  await gameLoop(player);
})();