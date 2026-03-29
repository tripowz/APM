import type {
  AppLocale,
  BookingStatus,
  DisplayCurrency,
  ExpenseCategory,
  PaymentStatus
} from "@/lib/types/domain";

const messages = {
  ru: {
    app: {
      name: "Apart Manager",
      subtitle: "Управление квартирами посуточно",
      signOut: "Выйти",
      currentUser: "Вы",
      owner: "Владелец",
      member: "Сотрудник",
      save: "Сохранить",
      back: "Назад",
      apply: "Применить",
      open: "Открыть",
      edit: "Изменить",
      delete: "Удалить",
      cancel: "Отменить",
      noData: "Пока нет данных"
    },
    navigation: {
      dashboard: { title: "Главная", description: "Сводка на сегодня" },
      calendar: { title: "Календарь", description: "Заезды и выезды" },
      apartments: { title: "Квартиры", description: "Объекты и статусы" },
      expenses: { title: "Расходы", description: "Траты и категории" },
      reports: { title: "Отчеты", description: "Доходы и загрузка" },
      settings: { title: "Настройки", description: "Профиль и команда" }
    },
    topbar: {
      language: "Язык",
      currency: "Валюта",
      languageRu: "Русский",
      languageUz: "O'zbekcha",
      currencyUsd: "USD",
      currencyUzs: "UZS"
    },
    auth: {
      title: "Вход в систему",
      description:
        "Войдите, чтобы открыть календарь, бронирования, расходы и отчеты.",
      email: "Электронная почта",
      password: "Пароль",
      submit: "Войти",
      submitting: "Входим...",
      envWarning:
        "Подключение к Supabase еще не настроено. Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local или в настройки проекта Vercel.",
      helperTitle: "Доступ для команды",
      helperDescription:
        "Вход выполняется через Supabase Auth. Для каждого пользователя хранится профиль с ролью."
    },
    statuses: {
      booking: {
        new: "Новая",
        confirmed: "Подтверждена",
        checked_in: "Гость заселен",
        checked_out: "Выезд завершен",
        cancelled: "Отменена"
      },
      payment: {
        unpaid: "Не оплачено",
        partial: "Частично оплачено",
        paid: "Оплачено"
      },
      expenseCategory: {
        cleaning: "Уборка",
        repair: "Ремонт",
        supplies: "Расходники",
        utilities: "Коммунальные",
        commission: "Комиссия",
        marketing: "Реклама",
        other: "Другое"
      },
      apartmentStatus: {
        active: "Активна",
        inactive: "Неактивна"
      }
    },
    dashboard: {
      eyebrow: "Сегодня",
      title: "Ежедневная сводка по объектам",
      description:
        "Смотрите загрузку, заезды, выезды и финансовый результат по всем квартирам.",
      addExpense: "Добавить расход",
      addBooking: "Добавить бронь",
      occupiedToday: "Занято сегодня",
      occupiedTodayDesc: "Квартиры, где сейчас идет проживание.",
      freeToday: "Свободно сегодня",
      freeTodayDesc: "Активные квартиры без гостей на сегодня.",
      upcomingCheckIns: "Скоро заезд",
      upcomingCheckInsDesc: "Ближайшие заезды на 7 дней.",
      upcomingCheckOuts: "Скоро выезд",
      upcomingCheckOutsDesc: "Ближайшие выезды на 7 дней.",
      monthlyRevenue: "Доход за месяц",
      monthlyRevenueDesc: "Подтвержденные брони текущего месяца.",
      monthlyExpenses: "Расходы за месяц",
      monthlyExpensesDesc: "Записанные расходы за текущий месяц.",
      monthlyProfit: "Прибыль за месяц",
      monthlyProfitDesc: "Доход минус расходы.",
      todayActions: "Действия на сегодня",
      todayActionsDesc:
        "Кнопки заселения и выезда появляются только в нужный день.",
      recentBookings: "Последние бронирования",
      recentBookingsDesc: "Недавние брони и их текущий статус.",
      revenueTrend: "Динамика дохода",
      revenueTrendDesc: "Последние 6 месяцев в удобном обзоре.",
      apartmentPerformance: "Результат по квартирам",
      apartmentPerformanceDesc:
        "Сколько бронирований, доходов и расходов приносит каждый объект.",
      noRecentBookings: "Пока нет бронирований.",
      noApartmentsTitle: "Пока нет квартир для анализа",
      noApartmentsDescription:
        "Добавьте первый объект, чтобы видеть доходы, расходы и прибыль.",
      checkIn: "Заселить",
      checkOut: "Выселить",
      todayEmptyTitle: "На сегодня нет действий",
      todayEmptyDescription:
        "Когда на сегодняшнюю дату появятся заезды или выезды, они будут показаны здесь."
    },
    calendar: {
      eyebrow: "Календарь",
      title: "Календарь бронирований",
      description:
        "Следите за занятостью по дням, фильтруйте по квартире и быстро открывайте бронь.",
      controls: "Управление календарем",
      controlsDesc:
        "Переключайте месяц, фильтруйте нужную квартиру и создавайте новую бронь.",
      addBooking: "Добавить бронь",
      allApartments: "Все квартиры",
      filter: "Показать",
      emptyMonth: "В этом месяце бронирований пока нет",
      emptyMonthDesc: "Добавьте бронь, чтобы увидеть занятость в календаре.",
      moreBookings: "еще бронирований"
    },
    apartments: {
      eyebrow: "Квартиры",
      title: "Список квартир",
      description:
        "Держите под рукой адрес, статус, брони, доходы и расходы по каждому объекту.",
      newApartment: "Добавить квартиру",
      filtersTitle: "Фильтры",
      filtersDesc: "Ищите по названию или адресу и отбирайте по статусу.",
      searchPlaceholder: "Название квартиры или адрес",
      allStatuses: "Все статусы",
      listTitle: "Квартиры",
      noneTitle: "По вашему фильтру ничего не найдено",
      noneDescription:
        "Сбросьте поиск или добавьте новую квартиру, чтобы начать учет.",
      bookings: "Брони",
      revenue: "Доход",
      expenses: "Расходы",
      profit: "Прибыль",
      open: "Открыть",
      form: {
        title: "Название квартиры",
        status: "Статус",
        address: "Адрес",
        basePrice: "Базовая цена за ночь",
        notes: "Заметки",
        notesHint: "Пишите только полезную информацию для работы.",
        save: "Сохранить квартиру",
        create: "Добавить квартиру",
        saving: "Сохраняем..."
      }
    },
    bookings: {
      eyebrow: "Бронирование",
      apartment: "Квартира",
      guestName: "Имя гостя",
      guestPhone: "Телефон гостя",
      checkIn: "Дата заезда",
      checkOut: "Дата выезда",
      totalAmount: "Сумма брони",
      prepaidAmount: "Предоплата",
      paymentStatus: "Оплата",
      bookingStatus: "Статус брони",
      notes: "Комментарий",
      currency: "Валюта",
      exchangeRate: "Курс",
      totalUsd: "Сумма в USD",
      selectApartment: "Выберите квартиру",
      noApartments: "Сначала добавьте хотя бы одну квартиру.",
      submitCreate: "Сохранить бронь",
      submitEdit: "Обновить бронь",
      submitCreating: "Сохраняем бронь...",
      submitEditing: "Обновляем бронь...",
      cancelBooking: "Отменить бронь",
      deleteBooking: "Удалить бронь",
      dangerTitle: "Опасная зона",
      dangerDescription:
        "Отмена сохраняет историю и освобождает даты. Удаление полностью убирает запись.",
      editTitle: "Карточка брони",
      todayActionTitle: "Действие по брони",
      todayActionDescription:
        "Если сегодня дата заезда или выезда, здесь появится нужная кнопка.",
      checkInSuccess: "Гость заселен.",
      checkOutSuccess: "Выезд подтвержден."
    },
    expenses: {
      eyebrow: "Расходы",
      title: "Учет расходов",
      description:
        "Записывайте расходы по квартирам, фильтруйте по датам и категориям и сразу видьте итог.",
      addExpense: "Добавить расход",
      filtersTitle: "Фильтры",
      filtersDesc:
        "Выберите период, квартиру и категорию, чтобы оставить только нужные записи.",
      ledgerTitle: "Список расходов",
      emptyTitle: "По выбранным фильтрам расходов нет",
      emptyDescription:
        "Попробуйте другой период или добавьте новый расход по квартире.",
      apartment: "Квартира",
      amount: "Сумма",
      amountUsd: "Сумма в USD",
      amountOriginal: "Сумма расхода",
      date: "Дата расхода",
      note: "Комментарий",
      category: "Категория",
      totalForPeriod: "Итого за период",
      allCategories: "Все категории",
      form: {
        apartment: "Квартира",
        amount: "Сумма расхода",
        currency: "Валюта",
        category: "Категория",
        expenseDate: "Дата расхода",
        note: "Комментарий",
        placeholder: "На что был этот расход?",
        create: "Сохранить расход",
        save: "Обновить расход",
        creating: "Сохраняем расход...",
        saving: "Обновляем расход..."
      }
    },
    reports: {
      eyebrow: "Отчеты",
      title: "Отчеты по доходам и загрузке",
      description:
        "Смотрите доходы, расходы, прибыль, средний чек, выручку за ночь и загрузку за выбранный период.",
      filtersTitle: "Параметры отчета",
      filtersDesc:
        "Выберите период, квартиру и нужный статус брони для детализации отчета.",
      today: "Сегодня",
      week: "Неделя",
      month: "Месяц",
      custom: "Свой период",
      revenue: "Доход",
      expenses: "Расходы",
      profit: "Прибыль",
      bookingsCount: "Количество броней",
      averageBookingValue: "Средний чек",
      averageRevenuePerNight: "Доход за ночь",
      occupancy: "Загрузка",
      apartmentBreakdown: "По квартирам",
      categoryBreakdown: "По категориям расходов",
      bookingsList: "Брони в отчете",
      expensesList: "Расходы в отчете",
      trend: "Тренд",
      noDataTitle: "За выбранный период данных пока нет",
      noDataDescription:
        "Попробуйте расширить период или добавьте бронирования и расходы.",
      occupiedDays: "Занятые дни",
      availableDays: "Доступные дни",
      occupancyRate: "Процент загрузки"
    },
    settings: {
      eyebrow: "Настройки",
      title: "Настройки бизнеса",
      description:
        "Изменяйте название бизнеса, валюту по умолчанию, часовой пояс и состав команды.",
      profileTitle: "Профиль бизнеса",
      profileDesc: "Эти данные используются в интерфейсе и отчетах.",
      teamTitle: "Команда",
      teamDesc: "Добавляйте сотрудников и меняйте их роль.",
      addUserTitle: "Добавить пользователя",
      addUserDesc:
        "Создайте аккаунт сотрудника или второго владельца прямо из панели.",
      currentUser: "Текущий пользователь",
      inAppEnabled: "Добавление доступно",
      manualFallback: "Нужно включить ключ",
      onlyOwner: "Только владелец может управлять пользователями.",
      serviceRoleHint:
        "Чтобы создавать пользователей из приложения, добавьте SUPABASE_SERVICE_ROLE_KEY в серверное окружение.",
      noUsersTitle: "Профили пользователей пока не созданы",
      noUsersDescription:
        "Текущий аккаунт может работать дальше. Когда появятся профили сотрудников, они будут показаны здесь."
    },
    forms: {
      required: "Заполните это поле.",
      saveError: "Не удалось сохранить данные. Попробуйте еще раз."
    },
    validations: {
      apartmentRequired: "Выберите квартиру.",
      guestNameRequired: "Укажите имя гостя.",
      checkInRequired: "Укажите дату заезда.",
      checkOutRequired: "Укажите дату выезда.",
      checkoutAfterCheckin: "Дата выезда должна быть позже даты заезда.",
      prepaidExceedsTotal: "Предоплата не может быть больше общей суммы.",
      amountNegative: "Сумма не может быть отрицательной.",
      expenseDateRequired: "Укажите дату расхода.",
      bookingConflict: "Эти даты уже заняты другой бронью."
    }
  },
  uz: {
    app: {
      name: "Apart Manager",
      subtitle: "Kvartiralarni kunlik boshqarish",
      signOut: "Chiqish",
      currentUser: "Siz",
      owner: "Egasi",
      member: "Xodim",
      save: "Saqlash",
      back: "Orqaga",
      apply: "Qo'llash",
      open: "Ochish",
      edit: "Tahrirlash",
      delete: "O'chirish",
      cancel: "Bekor qilish",
      noData: "Hozircha ma'lumot yo'q"
    },
    navigation: {
      dashboard: { title: "Asosiy", description: "Bugungi holat" },
      calendar: { title: "Kalendar", description: "Kelish va chiqishlar" },
      apartments: { title: "Kvartiralar", description: "Obyektlar va holat" },
      expenses: { title: "Xarajatlar", description: "Sarflar va toifalar" },
      reports: { title: "Hisobotlar", description: "Daromad va bandlik" },
      settings: { title: "Sozlamalar", description: "Profil va jamoa" }
    },
    topbar: {
      language: "Til",
      currency: "Valyuta",
      languageRu: "Русский",
      languageUz: "O'zbekcha",
      currencyUsd: "USD",
      currencyUzs: "UZS"
    },
    auth: {
      title: "Tizimga kirish",
      description:
        "Kalendar, bronlar, xarajatlar va hisobotlarni ko'rish uchun tizimga kiring.",
      email: "Elektron pochta",
      password: "Parol",
      submit: "Kirish",
      submitting: "Kirilmoqda...",
      envWarning:
        "Supabase ulanishi hali sozlanmagan. .env.local yoki Vercel sozlamalariga NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY qiymatlarini qo'shing.",
      helperTitle: "Jamoa uchun kirish",
      helperDescription:
        "Kirish Supabase Auth orqali ishlaydi. Har bir foydalanuvchi uchun alohida rol saqlanadi."
    },
    statuses: {
      booking: {
        new: "Yangi",
        confirmed: "Tasdiqlangan",
        checked_in: "Joylashtirildi",
        checked_out: "Chiqib ketdi",
        cancelled: "Bekor qilingan"
      },
      payment: {
        unpaid: "To'lanmagan",
        partial: "Qisman to'langan",
        paid: "To'langan"
      },
      expenseCategory: {
        cleaning: "Tozalash",
        repair: "Ta'mirlash",
        supplies: "Sarf buyumlari",
        utilities: "Kommunal xizmatlar",
        commission: "Komissiya",
        marketing: "Reklama",
        other: "Boshqa"
      },
      apartmentStatus: {
        active: "Faol",
        inactive: "Faol emas"
      }
    },
    dashboard: {
      eyebrow: "Bugun",
      title: "Obyektlar bo'yicha kunlik ko'rinish",
      description:
        "Barcha kvartiralar bo'yicha bandlik, kelish-chiqish va moliyaviy natijani ko'ring.",
      addExpense: "Xarajat qo'shish",
      addBooking: "Bron qo'shish",
      occupiedToday: "Bugun band",
      occupiedTodayDesc: "Hozir mehmon yashab turgan kvartiralar.",
      freeToday: "Bugun bo'sh",
      freeTodayDesc: "Bugun mehmonsiz faol kvartiralar.",
      upcomingCheckIns: "Yaqin kelishlar",
      upcomingCheckInsDesc: "Kelasi 7 kundagi kelishlar.",
      upcomingCheckOuts: "Yaqin chiqishlar",
      upcomingCheckOutsDesc: "Kelasi 7 kundagi chiqishlar.",
      monthlyRevenue: "Oy daromadi",
      monthlyRevenueDesc: "Joriy oy uchun tasdiqlangan bronlar.",
      monthlyExpenses: "Oy xarajatlari",
      monthlyExpensesDesc: "Joriy oyda kiritilgan xarajatlar.",
      monthlyProfit: "Oy foydasi",
      monthlyProfitDesc: "Daromad minus xarajatlar.",
      todayActions: "Bugungi amallar",
      todayActionsDesc:
        "Joylashtirish va chiqarish tugmalari faqat kerakli kunda ko'rinadi.",
      recentBookings: "So'nggi bronlar",
      recentBookingsDesc: "Yaqinda qo'shilgan bronlar va ularning holati.",
      revenueTrend: "Daromad dinamikasi",
      revenueTrendDesc: "So'nggi 6 oy bo'yicha qisqa ko'rinish.",
      apartmentPerformance: "Kvartiralar natijasi",
      apartmentPerformanceDesc:
        "Har bir obyekt nechta bron, daromad va xarajat olib kelayotganini ko'ring.",
      noRecentBookings: "Hozircha bronlar yo'q.",
      noApartmentsTitle: "Tahlil uchun kvartiralar yo'q",
      noApartmentsDescription:
        "Daromad va xarajatlarni ko'rish uchun birinchi kvartirani qo'shing.",
      checkIn: "Joylashtirish",
      checkOut: "Chiqishni yopish",
      todayEmptyTitle: "Bugun uchun amallar yo'q",
      todayEmptyDescription:
        "Bugungi sana bo'yicha kelish yoki chiqish paydo bo'lsa, ular shu yerda ko'rinadi."
    },
    calendar: {
      eyebrow: "Kalendar",
      title: "Bronlar kalendari",
      description:
        "Bandlikni kunlar bo'yicha kuzating, kvartira bo'yicha filtrlang va bronni tez oching.",
      controls: "Kalendar boshqaruvi",
      controlsDesc:
        "Oyni almashtiring, kerakli kvartirani tanlang va yangi bron yarating.",
      addBooking: "Bron qo'shish",
      allApartments: "Barcha kvartiralar",
      filter: "Ko'rsatish",
      emptyMonth: "Bu oyda hali bronlar yo'q",
      emptyMonthDesc: "Bandlikni ko'rish uchun yangi bron qo'shing.",
      moreBookings: "yana bron"
    },
    apartments: {
      eyebrow: "Kvartiralar",
      title: "Kvartiralar ro'yxati",
      description:
        "Har bir obyekt bo'yicha manzil, holat, bronlar, daromad va xarajatlarni boshqaring.",
      newApartment: "Kvartira qo'shish",
      filtersTitle: "Filtrlar",
      filtersDesc: "Nom yoki manzil bo'yicha qidiring va holat bo'yicha filtrlang.",
      searchPlaceholder: "Kvartira nomi yoki manzil",
      allStatuses: "Barcha holatlar",
      listTitle: "Kvartiralar",
      noneTitle: "Bu filtr bo'yicha hech narsa topilmadi",
      noneDescription:
        "Qidiruvni tozalang yoki hisobni boshlash uchun yangi kvartira qo'shing.",
      bookings: "Bronlar",
      revenue: "Daromad",
      expenses: "Xarajatlar",
      profit: "Foyda",
      open: "Ochish",
      form: {
        title: "Kvartira nomi",
        status: "Holat",
        address: "Manzil",
        basePrice: "Bir kecha uchun asosiy narx",
        notes: "Izohlar",
        notesHint: "Faqat ish uchun foydali ma'lumotlarni yozing.",
        save: "Kvartirani saqlash",
        create: "Kvartira qo'shish",
        saving: "Saqlanmoqda..."
      }
    },
    bookings: {
      eyebrow: "Bron",
      apartment: "Kvartira",
      guestName: "Mehmon ismi",
      guestPhone: "Mehmon telefoni",
      checkIn: "Kelish sanasi",
      checkOut: "Chiqish sanasi",
      totalAmount: "Bron summasi",
      prepaidAmount: "Oldindan to'lov",
      paymentStatus: "To'lov",
      bookingStatus: "Bron holati",
      notes: "Izoh",
      currency: "Valyuta",
      exchangeRate: "Kurs",
      totalUsd: "USD dagi summa",
      selectApartment: "Kvartirani tanlang",
      noApartments: "Avval kamida bitta kvartira qo'shing.",
      submitCreate: "Bronni saqlash",
      submitEdit: "Bronni yangilash",
      submitCreating: "Bron saqlanmoqda...",
      submitEditing: "Bron yangilanmoqda...",
      cancelBooking: "Bronni bekor qilish",
      deleteBooking: "Bronni o'chirish",
      dangerTitle: "Diqqat",
      dangerDescription:
        "Bekor qilish tarixni saqlaydi va sanalarni bo'shatadi. O'chirish yozuvni butunlay olib tashlaydi.",
      editTitle: "Bron kartasi",
      todayActionTitle: "Bron bo'yicha amal",
      todayActionDescription:
        "Agar bugun kelish yoki chiqish sanasi bo'lsa, kerakli tugma shu yerda chiqadi.",
      checkInSuccess: "Mehmon joylashtirildi.",
      checkOutSuccess: "Chiqish tasdiqlandi."
    },
    expenses: {
      eyebrow: "Xarajatlar",
      title: "Xarajatlar hisobi",
      description:
        "Kvartiralar bo'yicha xarajatlarni kiriting, sanalar va toifalar bo'yicha filtrlang, natijani darhol ko'ring.",
      addExpense: "Xarajat qo'shish",
      filtersTitle: "Filtrlar",
      filtersDesc:
        "Kerakli yozuvlarni qoldirish uchun davr, kvartira va toifani tanlang.",
      ledgerTitle: "Xarajatlar ro'yxati",
      emptyTitle: "Tanlangan filtrlar bo'yicha xarajatlar yo'q",
      emptyDescription:
        "Boshqa davrni tanlang yoki kvartira bo'yicha yangi xarajat qo'shing.",
      apartment: "Kvartira",
      amount: "Summa",
      amountUsd: "USD dagi summa",
      amountOriginal: "Xarajat summasi",
      date: "Xarajat sanasi",
      note: "Izoh",
      category: "Toifa",
      totalForPeriod: "Davr bo'yicha jami",
      allCategories: "Barcha toifalar",
      form: {
        apartment: "Kvartira",
        amount: "Xarajat summasi",
        currency: "Valyuta",
        category: "Toifa",
        expenseDate: "Xarajat sanasi",
        note: "Izoh",
        placeholder: "Bu xarajat nimaga sarflandi?",
        create: "Xarajatni saqlash",
        save: "Xarajatni yangilash",
        creating: "Xarajat saqlanmoqda...",
        saving: "Xarajat yangilanmoqda..."
      }
    },
    reports: {
      eyebrow: "Hisobotlar",
      title: "Daromad va bandlik hisobotlari",
      description:
        "Tanlangan davr bo'yicha daromad, xarajat, foyda, o'rtacha qiymat, bir kecha daromadi va bandlikni ko'ring.",
      filtersTitle: "Hisobot parametrlari",
      filtersDesc:
        "Hisobotni aniqlashtirish uchun davr, kvartira va kerakli bron holatini tanlang.",
      today: "Bugun",
      week: "Hafta",
      month: "Oy",
      custom: "Maxsus davr",
      revenue: "Daromad",
      expenses: "Xarajatlar",
      profit: "Foyda",
      bookingsCount: "Bronlar soni",
      averageBookingValue: "O'rtacha qiymat",
      averageRevenuePerNight: "Bir kecha daromadi",
      occupancy: "Bandlik",
      apartmentBreakdown: "Kvartiralar bo'yicha",
      categoryBreakdown: "Xarajat toifalari bo'yicha",
      bookingsList: "Hisobotdagi bronlar",
      expensesList: "Hisobotdagi xarajatlar",
      trend: "Trend",
      noDataTitle: "Tanlangan davr uchun hozircha ma'lumot yo'q",
      noDataDescription:
        "Davrni kengaytiring yoki bron va xarajatlarni qo'shing.",
      occupiedDays: "Band kunlar",
      availableDays: "Mavjud kunlar",
      occupancyRate: "Bandlik foizi"
    },
    settings: {
      eyebrow: "Sozlamalar",
      title: "Biznes sozlamalari",
      description:
        "Biznes nomi, asosiy valyuta, vaqt zonasi va jamoa tarkibini boshqaring.",
      profileTitle: "Biznes profili",
      profileDesc: "Bu ma'lumotlar interfeys va hisobotlarda ishlatiladi.",
      teamTitle: "Jamoa",
      teamDesc: "Xodimlarni qo'shing va ularning rolini yangilang.",
      addUserTitle: "Foydalanuvchi qo'shish",
      addUserDesc:
        "Panel ichidan xodim yoki ikkinchi egasi uchun akkaunt yarating.",
      currentUser: "Joriy foydalanuvchi",
      inAppEnabled: "Qo'shish yoqilgan",
      manualFallback: "Kalit kerak",
      onlyOwner: "Foydalanuvchilarni faqat egasi boshqara oladi.",
      serviceRoleHint:
        "Ilova ichidan foydalanuvchi yaratish uchun SUPABASE_SERVICE_ROLE_KEY ni server muhitiga qo'shing.",
      noUsersTitle: "Hali foydalanuvchi profillari yo'q",
      noUsersDescription:
        "Joriy akkaunt ishlashda davom etadi. Xodim profillari paydo bo'lsa, ular shu yerda ko'rinadi."
    },
    forms: {
      required: "Bu maydonni to'ldiring.",
      saveError: "Ma'lumotni saqlab bo'lmadi. Yana urinib ko'ring."
    },
    validations: {
      apartmentRequired: "Kvartirani tanlang.",
      guestNameRequired: "Mehmon ismini kiriting.",
      checkInRequired: "Kelish sanasini kiriting.",
      checkOutRequired: "Chiqish sanasini kiriting.",
      checkoutAfterCheckin: "Chiqish sanasi kelish sanasidan keyin bo'lishi kerak.",
      prepaidExceedsTotal: "Oldindan to'lov umumiy summadan oshmasligi kerak.",
      amountNegative: "Summa manfiy bo'lishi mumkin emas.",
      expenseDateRequired: "Xarajat sanasini kiriting.",
      bookingConflict: "Bu sanalar boshqa bron bilan band."
    }
  }
} as const;

function mergeMessages<T extends Record<string, unknown>>(
  base: T,
  overrides: Record<string, unknown>
): T {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    const baseValue = result[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeMessages(
        baseValue as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

export type AppMessages = typeof messages.ru;

export function getMessages(locale: AppLocale): AppMessages {
  return locale === "uz"
    ? mergeMessages(messages.ru, messages.uz as Record<string, unknown>)
    : messages.ru;
}

export function getBookingStatusLabel(locale: AppLocale, status: BookingStatus) {
  return getMessages(locale).statuses.booking[status];
}

export function getPaymentStatusLabel(locale: AppLocale, status: PaymentStatus) {
  return getMessages(locale).statuses.payment[status];
}

export function getExpenseCategoryLabel(
  locale: AppLocale,
  category: ExpenseCategory
) {
  return getMessages(locale).statuses.expenseCategory[category];
}

export function getDisplayCurrencyLabel(
  locale: AppLocale,
  currency: DisplayCurrency
) {
  const messages = getMessages(locale);

  return currency === "USD"
    ? messages.topbar.currencyUsd
    : messages.topbar.currencyUzs;
}
