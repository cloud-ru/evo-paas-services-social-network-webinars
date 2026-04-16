import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@app/prisma-user';

@Injectable()
export class UserSeedingService implements OnModuleInit {
  private readonly logger = new Logger(UserSeedingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const userCount = await this.prisma.client.userProfile.count();
    if (userCount > 100) {
      this.logger.log('Users already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding 1000 users...');

    const maleFirstNames = [
      'Александр',
      'Сергей',
      'Андрей',
      'Дмитрий',
      'Алексей',
      'Максим',
      'Владимир',
      'Иван',
      'Михаил',
      'Кирилл',
      'Николай',
      'Евгений',
      'Олег',
      'Павел',
      'Юрий',
      'Роман',
      'Игорь',
      'Артем',
      'Руслан',
      'Егор',
      'Константин',
      'Антон',
      'Денис',
      'Вадим',
      'Виктор',
      'Борис',
      'Станислав',
      'Леонид',
    ];

    const femaleFirstNames = [
      'Анастасия',
      'Мария',
      'Анна',
      'Елена',
      'Татьяна',
      'Ольга',
      'Наталья',
      'Екатерина',
      'Светлана',
      'Ирина',
      'Юлия',
      'Марина',
      'Виктория',
      'Дарья',
      'Ксения',
      'Александра',
      'Полина',
      'Алиса',
      'Вероника',
      'София',
      'Валерия',
      'Кристина',
      'Оксана',
      'Людмила',
      'Надежда',
    ];

    const lastNames = [
      'Иванов',
      'Смирнов',
      'Кузнецов',
      'Попов',
      'Васильев',
      'Петров',
      'Соколов',
      'Михайлов',
      'Новиков',
      'Федоров',
      'Морозов',
      'Волков',
      'Алексеев',
      'Лебедев',
      'Семенов',
      'Егоров',
      'Павлов',
      'Козлов',
      'Степанов',
      'Николаев',
      'Орлов',
      'Андреев',
      'Макаров',
      'Никитин',
      'Захаров',
    ];

    const usersToCreate: Prisma.UserProfileCreateManyInput[] = [];

    for (let i = 0; i < 1000; i++) {
      const isMale = Math.random() > 0.5;
      const firstName = isMale
        ? maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)]
        : femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];

      let lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      if (!isMale) {
        lastName += 'а';
      }

      const userId = randomUUID();
      const emailFirstName = this.transliterate(firstName).toLowerCase();
      const emailLastName = this.transliterate(lastName).toLowerCase();
      const email = `${emailFirstName}.${emailLastName}.${Math.floor(Math.random() * 10000)}@example.com`;

      usersToCreate.push({
        userId,
        email,
        firstName,
        lastName,
        bio: 'Сгенерированный пользователь',
        status: Math.random() > 0.7 ? 'online' : 'offline',
        lastActivityAt: new Date(
          Date.now() - Math.floor(Math.random() * 10000000),
        ),
      });
    }

    try {
      await this.prisma.client.userProfile.createMany({
        data: usersToCreate,
        skipDuplicates: true,
      });
      this.logger.log('Seeding complete!');
    } catch (e) {
      this.logger.error('Failed to seed users', e);
    }
  }

  private transliterate(word: string): string {
    const map: Record<string, string> = {
      а: 'a',
      б: 'b',
      в: 'v',
      г: 'g',
      д: 'd',
      е: 'e',
      ё: 'yo',
      ж: 'zh',
      з: 'z',
      и: 'i',
      й: 'y',
      к: 'k',
      л: 'l',
      м: 'm',
      н: 'n',
      о: 'o',
      п: 'p',
      р: 'r',
      с: 's',
      т: 't',
      у: 'u',
      ф: 'f',
      х: 'kh',
      ц: 'ts',
      ч: 'ch',
      ш: 'sh',
      щ: 'shch',
      ъ: '',
      ы: 'y',
      ь: '',
      э: 'e',
      ю: 'yu',
      я: 'ya',
      А: 'A',
      Б: 'B',
      В: 'V',
      Г: 'G',
      Д: 'D',
      Е: 'E',
      Ё: 'Yo',
      Ж: 'Zh',
      З: 'Z',
      И: 'I',
      Й: 'Y',
      К: 'K',
      Л: 'L',
      М: 'M',
      Н: 'N',
      О: 'O',
      П: 'P',
      Р: 'R',
      С: 'S',
      Т: 'T',
      У: 'U',
      Ф: 'F',
      Х: 'Kh',
      Ц: 'Ts',
      Ч: 'Ch',
      Ch: 'Ch',
      Ш: 'Sh',
      Sh: 'Sh',
      Щ: 'Shch',
      Shch: 'Shch',
      Ъ: '',
      Ы: 'Y',
      Ь: '',
      Э: 'E',
      Ю: 'Yu',
      Я: 'Ya',
    };
    return word
      .split('')
      .map((char) => map[char] || char)
      .join('');
  }
}
