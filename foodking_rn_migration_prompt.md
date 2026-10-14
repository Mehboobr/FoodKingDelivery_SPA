# FoodKing Delivery Boy — React Native Migration Prompt

> **Paste this entire prompt into your React Native project's coding agent.**
> Language: **JavaScript** (not TypeScript). Do NOT add TypeScript unless the existing project already enforces it.

---

## 0. Context & Goals

You are implementing a **React Native (JavaScript)** delivery-boy app called **FoodKing** by migrating a production Flutter app. The Flutter app has already been fully analyzed. Your job is to:

1. Recreate **all existing functionality** without changing any backend APIs or business logic.
2. Modernize the UI while keeping the FoodKing branding (primary pink `#FF006B`, Rubik font family).
3. Produce a well-structured, maintainable codebase using a clean folder architecture.
4. Do **NOT** invent any features that do not already exist.
5. Do **NOT** hardcode credentials or secrets — read them from environment config.
6. Do **NOT** omit any screen or business rule.

---

## 1. Backend API Reference

> FLAG FOR VERIFICATION: The `baseUrl` and `licenseCode` values below come from the Flutter source. Confirm with the team before deploying to production. Do NOT commit them to version control; store in `.env`.

| Key | Value |
|-----|-------|
| Base URL | `https://demo.foodking.dev` |
| License Code Header (x-api-key) | `b6d68vy2-m7g5-20r0-5275-h103w73453q120` |

### API Endpoints

| Name | Method | Path | Auth Required |
|------|--------|------|---------------|
| Login | POST | `/api/auth/login` | No (x-api-key only) |
| Refresh Token | GET | `/api/refresh-token?token={rawToken}` | No |
| Profile | GET | `/api/profile` | Yes (Bearer) |
| Update Profile | PUT | `/api/profile` | Yes |
| Change Password | PUT | `/api/profile/change-password` | Yes |
| Change Profile Image | POST (multipart) | `/api/profile/change-image` | Yes |
| Branch List | GET | `/api/frontend/branch` | Yes |
| Configuration | GET | `/api/frontend/setting` | No |
| Country Info | GET | `/api/frontend/country-code/show/{countryCode}` | No |
| Language List | GET | `/api/frontend/language` | No |
| Static Pages | GET | `/api/frontend/page` | No |
| Order List | GET | `/api/frontend/delivery-boy-order` | Yes |
| Order Details | GET | `/api/frontend/delivery-boy-order/show/{id}` | Yes |
| Order Count | GET | `/api/frontend/delivery-boy-order/count` | Yes |
| Change Order Status | POST | `/api/frontend/delivery-boy-order/change-status/{id}` | Yes |
| Register Device Token | POST | `/api/frontend/device-token/mobile` | Yes |

### Authentication

- **Login**: POST `{"email": "...", "password": "..."}` to get `201` response with `{ token, branch_id, user: { role_id, ... } }`.
- Only users with `role_id === 3` (delivery boy) are allowed. Reject anyone else with: "Only delivery boy can login to this app".
- Store `"Bearer " + token` in `AsyncStorage` under key `token`.
- Store raw token under key `justToken` for refresh calls.
- Store `isLoggedIn` (string `'true'`/`'false'`) and `branchId` (number) in `AsyncStorage`.
- Every authenticated request must include:
  ```
  Authorization: Bearer {token}
  x-api-key: {licenseCode}
  content-type: application/json
  ```
- Unauthenticated requests include only `x-api-key` and `content-type`.
- On app start: if `isLoggedIn === 'true'`, call refresh token endpoint. If refresh fails (non-201 status), clear auth state and redirect to Login.

---

## 2. Data Models

### LoginResponse
```js
{
  message: string,
  token: string,
  branch_id: number,
  user: {
    id: number, name: string,
    first_name: string, last_name: string,
    phone: string, email: string, username: string,
    image: string,    // full URL
    role_id: number,  // must be 3
  }
}
```

### ProfileData
```js
{
  id: number, name: string,
  first_name: string, last_name: string,
  phone: string, email: string, username: string,
  image: string,  // full URL
  create_date: string, update_date: string,
}
```

### OrderListItem
```js
{
  id: number,
  order_serial_no: string,
  order_type: number,      // 5=delivery, 10=pick&pay
  order_datetime: string,
  order_date: string, order_time: string,
  delivery_date: string, delivery_time: string,
  payment_method: number,
  payment_status: number,  // 5=paid, 10=unpaid
  is_advance_order: number,
  status: number,          // see status codes table below
  status_name: string,
  reason: any,
  order_address: {
    id: number, user_id: number, label: string,
    address: string, apartment: string,
    latitude: string, longitude: string,
  }
}
```

### Order Status Codes
| Code | Meaning | Badge BG | Badge Text |
|------|---------|----------|-----------|
| 1 | Pending | `#FFEEC6` | `#F6A609` |
| 4 | Preparing | `#E1FFED` | `#2AC769` |
| 7 | On the way (ready) | `#E1FFED` | `#2AC769` |
| 10 | On the way (delivering) | `#BDECFF` | `#008BBA` |
| 13 | Delivered | `#E1FFED` | `#2AC769` |
| 14 | Canceled | `#FFDADA` | `#FB4E4E` |
| 19 | Returned | `#FFDADA` | `#FB4E4E` |
| 22 | Returned | `#FFDADA` | `#FB4E4E` |

**Active orders** = status NOT in `[13, 22]`
**History orders** = status IN `[13, 22]`

### OrderDetails (extends OrderListItem)
```js
{
  // all OrderListItem fields, plus:
  token: any,
  subtotal_currency_price: string,
  discount_currency_price: string,
  delivery_charge_currency_price: string,
  total_currency_price: string,
  preparation_time: number,  // minutes
  user: {  // customer
    id, name, first_name, last_name, phone, email, username,
    balance, image, role_id, country_code, order, create_date, update_date
  },
  branch: {
    id, name, email, phone, latitude, longitude,
    city, state, zip_code, address, status
  },
  delivery_boy: { /* same shape as user */ },
  coupon: any,
  transaction: {  // null if cash on delivery
    id, order_id, order_serial_no, transaction_no,
    amount, payment_method, type, sign, date
  } | null,
  order_items: [{
    id, order_id, branch_id, item_id,
    item_name: string,
    item_image: string,  // full URL
    quantity: number,
    discount: string, price: string,
    item_variations: [{ id, item_id, item_attribute_id, variation_name, name }],
    item_extras: [{ id, item_id, name }],
    item_variation_currency_total: string,
    item_extra_currency_total: string,
    total_convert_price: number,
    total_currency_price: string,
    instruction: string | null,
  }]
}
```

### CountData
```js
{ total_delivered: number, total_returned: number }
```

### CountryInfo
```js
{ calling_code: string, flag_emoji: string }
```

### LanguageData
```js
{ code: string, name: string, image: string }
```

### PageData
```js
{ title: string, description: string }  // description is HTML
```

---

## 3. Project Folder Architecture

```
src/
├── api/
│   ├── client.js              # axios instance (authenticated)
│   ├── publicClient.js        # axios instance (unauthenticated)
│   └── config.js              # BASE_URL, LICENSE_CODE from env
├── services/
│   ├── authService.js
│   ├── orderService.js
│   ├── profileService.js
│   └── configService.js
├── store/
│   ├── authStore.js
│   ├── orderStore.js
│   ├── profileStore.js
│   └── configStore.js
├── screens/
│   ├── SplashScreen.js
│   ├── LoginScreen.js
│   ├── Home/
│   │   └── HomeScreen.js
│   ├── OrderDetails/
│   │   └── OrderDetailsScreen.js
│   ├── ConfirmDelivery/
│   │   └── ConfirmDeliveryScreen.js
│   ├── History/
│   │   └── HistoryScreen.js
│   └── Profile/
│       ├── ProfileScreen.js
│       ├── EditProfileScreen.js
│       ├── ChangePasswordScreen.js
│       ├── ChangeLanguageScreen.js
│       └── PagesScreen.js
├── components/
│   ├── common/
│   │   ├── CustomButton.js
│   │   ├── CustomInput.js
│   │   ├── LoaderOverlay.js
│   │   ├── EmptyState.js
│   │   ├── SkeletonLoader.js
│   │   ├── OrderStatusBadge.js
│   │   ├── ConfirmDialog.js
│   │   └── Toast.js
│   ├── home/
│   │   ├── StatCard.js
│   │   └── ActiveOrderCard.js
│   └── profile/
│       └── ProfileMenuItem.js
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   └── MainTabNavigator.js
├── hooks/
│   ├── useAuth.js
│   ├── useOrders.js
│   └── useProfile.js
├── utils/
│   ├── storage.js        # AsyncStorage wrappers
│   ├── notifications.js  # FCM helpers
│   ├── permissions.js    # location permission flow
│   └── validation.js     # form validators
├── constants/
│   ├── colors.js
│   ├── typography.js
│   ├── images.js
│   └── strings.js
└── localization/
    └── i18n.js
```

---

## 4. Required Dependencies

```bash
# Navigation
@react-navigation/native @react-navigation/native-stack
@react-navigation/bottom-tabs react-native-screens
react-native-safe-area-context

# HTTP
axios

# Storage
@react-native-async-storage/async-storage

# Images
react-native-fast-image

# Location & Maps
@react-native-community/geolocation
react-native-map-link

# Phone
react-native-communications

# Firebase
@react-native-firebase/app @react-native-firebase/messaging

# Notifications
@notifee/react-native

# Image Picker
react-native-image-picker

# WebView
react-native-webview

# HTML rendering
react-native-render-html

# State management
zustand

# i18n
i18next react-i18next

# SVG
react-native-svg

# Toast
react-native-toast-message
```

> FLAG FOR VERIFICATION: Confirm Google Maps API key setup with the team. The Flutter app imports `google_maps_flutter` and `flutter_polyline_points` but the current feature set only needs direction launching (no in-app map rendering), so `react-native-map-link` should be sufficient.

---

## 5. Theme / Design Tokens

### `src/constants/colors.js`
```js
export const Colors = {
  primary: '#FF006B',
  primaryBackground: '#FFFBFB',
  primaryLight: '#FFEDF4',
  font: '#1F1F39',
  divider: '#EFF0F6',
  textMuted: '#6E7191',
  itemBg: '#EFF0F6',
  cardGreen: '#D2FFF7',
  cardSky: '#DBF6FF',
  darkBlue: '#008BBA',
  green: '#1AB759',
  yellow: '#FFDB1F',
  gray: '#6E7191',
  bgColor: '#F7F7FC',
  darkGray: '#1F1F39',
  warning: '#F6A609',
  success: '#2AC769',
  error: '#FB4E4E',
  pending: '#FFEEC6',
  pendingText: '#F6A609',
  preparing: '#E1FFED',
  preparingText: '#2AC769',
  onTheWay: '#BDECFF',
  delivered: '#FFD7E7',
  canceled: '#FFDADA',
  white: '#FFFFFF',
  black: '#000000',
};
```

### `src/constants/typography.js`
```js
// Rubik font family: Regular(400), Medium(500), Bold(700), Black(900)
// Copy font files from Flutter assets/fonts/ or download from Google Fonts
// Register in react-native.config.js
export const Typography = {
  small:        { fontFamily: 'Rubik-Regular', fontSize: 10 },
  regular:      { fontFamily: 'Rubik-Regular', fontSize: 12 },
  body:         { fontFamily: 'Rubik-Regular', fontSize: 14 },
  bodyMedium:   { fontFamily: 'Rubik-Medium',  fontSize: 14 },
  bodyBold:     { fontFamily: 'Rubik-Bold',    fontSize: 14 },
  large:        { fontFamily: 'Rubik-Medium',  fontSize: 16 },
  largeBold:    { fontFamily: 'Rubik-Bold',    fontSize: 16 },
  heading:      { fontFamily: 'Rubik-Medium',  fontSize: 18 },
  display:      { fontFamily: 'Rubik-Bold',    fontSize: 22 },
  display2:     { fontFamily: 'Rubik-Bold',    fontSize: 26 },
  displayBlack: { fontFamily: 'Rubik-Black',   fontSize: 26 },
};
```

### `src/constants/strings.js`
```js
export const Strings = {
  welcomeBack: 'Welcome Back',
  home: 'Home', history: 'History', profile: 'Profile',
  completeDelivery: 'Complete Delivery',
  returnDelivery: 'Return Delivery',
  activeOrders: 'Active Orders',
  seeDetails: 'See Details',
  getDirection: 'Get Direction',
  orderId: 'Order Id : ',
  seeOrderDetails: 'See Order Details',
  confirmDelivery: 'Confirm Delivery',
  customer: 'Customer',
  orderDetails: 'Order Details',
  estimatedDeliveryTime: 'Your estimate delivery time',
  paymentInfo: 'Payment Info',
  method: 'Method', status: 'Status',
  orderSummary: 'Order Summary',
  extras: 'Extras', instruction: 'Instruction',
  subtotal: 'Subtotal', discount: 'Discount',
  deliveryCharge: 'Delivery Charge', total: 'Total',
  confirmDeliveryAlert: 'Are You Sure to Confirm Delivery?',
  noCancel: 'No, Cancel', yesConfirm: 'Yes, Confirm', yesCollect: 'Yes, Collect',
  cashOnDelivery: 'Cash On Delivery', pickAndPay: 'Pick & Pay',
  orderSuccessfullyDelivered: 'Order Successfully Delivered',
  backToHome: 'Back to Home',
  myProfile: 'My Profile', branch: 'Branch', allBranch: 'All Branch',
  logout: 'Log Out',
  error: 'Error', success: 'Success',
  changePassword: 'Change Password', changeLanguage: 'Change Language',
  editProfile: 'Edit Profile',
  firstName: 'First Name', lastName: 'Last Name',
  email: 'Email', password: 'Password', mobileNumber: 'Mobile Number',
  updateProfile: 'Update Profile',
  oldPassword: 'Old Password', newPassword: 'New Password',
  retypeNewPassword: 'Re-Type New Password',
  profileUpdatedSuccessfully: 'Profile Updated Successfully',
  passwordUpdatedSuccessfully: 'Password Updated Successfully',
  pressBackToExit: 'Press back again to exit.',
  rememberMe: 'Remember me',
  orderHistory: 'Order History',
  imageShouldBeLess2MB: 'Image should be less than 2MB',
  profileImageSaved: 'Profile image saved successfully',
  somethingWrong: 'Something Wrong',
  noOrderForDelivery: 'You have no order for delivery',
  waitNote: 'Wait until your branch manager submits the order to you for delivery.',
  noOrderHistory: 'You have no order history',
  deliveryAddress: 'Delivery Address',
  paid: 'Paid', unpaid: 'Unpaid',
  doYouCollectPayment: 'Do You Collect Payment?', amount: 'Amount',
  pleaseTypeFirstName: 'Please type your first name',
  pleaseTypeLastName: 'Please type your last name',
  pleaseTypeEmail: 'Please type your email',
  pleaseTypeOldPassword: 'Please type old password',
  pleaseTypeNewPassword: 'Please type your new password',
  pleaseRetypePassword: 'Please retype password',
  passwordMustBeSix: 'Password must be at least 6 characters',
  enterValidEmail: 'Enter valid email',
  locationServiceDenied: 'Location service is denied!',
  locationPermissionNotEnabled: 'Location permission is not enabled!',
  emailOrUsername: 'Email or Username',
};
```

---

## 6. Screen-by-Screen Implementation Guide

### 6.1 Splash Screen

- Centered `splash_logo.png` on white background.
- After 2 seconds: check `AsyncStorage.getItem('isLoggedIn')`:
  - `'true'` → call GET `/api/refresh-token?token={justToken}` → success: store new token, navigate to `MainTabs`; failure: clear storage, navigate to `Login`.
  - Anything else → navigate to `Login`.
- Also prefetch (in parallel): GET `/api/frontend/setting`, GET `/api/frontend/language`.
- After config loads, extract `company_country_code` and call GET `/api/frontend/country-code/show/{code}` to get `calling_code` and `flag_emoji`. Store in `configStore`.

---

### 6.2 Login Screen

**UI:**
- Background: `#FFFBFB`.
- Top left: `logo.png` (height 32).
- "Welcome Back" (Rubik Bold 22).
- Email/Username field (outlined, radius 8, border `#EFF0F6`, focus border `#FF006B`).
- Password field with eye icon toggle (initially hidden).
- Remember Me row (ticked/unticked SVG checkbox icons, label "Remember me").
- Login button: full width, height 52, borderRadius 26, background `#FF006B`, white Rubik Medium text.
- Semi-transparent white overlay + ActivityIndicator during loading.

**Validation:**
- Email/username: must not be empty.
- Password: min 6 characters.

**Login flow:**
1. POST `{email, password}` to `/api/auth/login` using unauthenticated client.
2. On 201:
   - If `user.role_id !== 3`: show error "Only delivery boy can login to this app".
   - Else: save `"Bearer " + response.token` as `token`, raw `response.token` as `justToken`, `response.branch_id` as `branchId`, `'true'` as `isLoggedIn`.
   - Fire-and-forget: GET FCM token, POST to `/api/frontend/device-token/mobile` with `{token: fcmToken}`.
   - GET `/api/profile` and store in `profileStore`.
   - Navigate to `MainTabs` (replace Login).
3. On error: parse `errors.validation[0]` or `message` from response body, show toast.
4. On network error: show "Network error. Please check your connection."

---

### 6.3 Main Tab Navigator

Three tabs:
- **Home** (icon: `home.png`) → `HomeScreen`
- **History** (icon: `history.png`) → `HistoryScreen`
- **Profile** (icon: `profile.png`) → `ProfileScreen`

Tab bar style:
- Active: `#FF006B` tint on icon + bold label.
- Inactive: `#6E7191`.
- Use a rounded pill highlight behind the active tab (custom tab bar).

On mount (once):
- `orderStore.getOrderList()`
- `orderStore.getOrderCount()`
- Request FCM notification permissions.
- `profileStore.getPages()`
- `profileStore.getBranches()`

Android back button: on first press show snackbar "Press back again to exit."; on second press within 2 seconds, exit.

---

### 6.4 Home Screen

**Header:** Logo (`logo.png`, height 32) left-aligned in app bar.

**Stat Cards:**
Two equal-width cards side by side (height ~132, borderRadius 16):
- Left — background `#D2FFF7`: SVG `order_complete.svg` icon + count (Rubik Black 26) + "Complete Delivery" label.
- Right — background `#DBF6FF`: SVG `return_delivery.svg` icon + count + "Return Delivery" label.
- Show `SkeletonLoader` while `loaders.count` is true. Show `0` if API returns null.

**Active Orders Section:**
- Heading "Active Orders" (Rubik Medium 16, black).
- Pull-to-refresh: call `getOrderList()` + `getOrderCount()`.
- Empty state: `EmptyState` with `order_empty.png`, "You have no order for delivery", waitNote string.
- For each order in `activeOrderList`: render `ActiveOrderCard`.

**ActiveOrderCard:**
White card, shadow, borderRadius 16, padding 12.
- Row 1: "Order Id : " + `order_serial_no` + `OrderStatusBadge`.
- Row 2: `order_datetime` (gray, small).
- Row 3: location SVG pin + `order_address.address` (max 2 lines, ellipsis).
- Row 4: two buttons side by side:
  - **See Details** (outlined, border `#EFF0F6`, width 140, height 36, borderRadius 16):
    Call `orderStore.getOrderDetails(id)` → fetches `/api/frontend/delivery-boy-order/show/{id}` → navigate to `OrderDetailsScreen`.
  - **Get Direction** (background `#FF006B`, white text, same size):
    Check location permission → open Google Maps directions to `{latitude},{longitude}`.

**Location permission logic:**
- Request permission.
- Denied → toast error "Location service is denied!".
- Permanently denied → Alert with "Open Settings" button.
- Granted → `openMaps({ latitude, longitude, provider: 'google' })` via `react-native-map-link`.

`LoaderOverlay` visible when `loaders.details` is true.

---

### 6.5 Order Details Screen

**Route param:** `orderId` (number).
Fetch on mount: GET `/api/frontend/delivery-boy-order/show/{orderId}`.
Pull-to-refresh: re-fetches.

**App bar:** "Order Details" (Rubik Bold 20), SVG back arrow.

**Scrollable body sections:**

**1. Header:**
- "Order Id : " + `order_serial_no` (color `#008BBA`) + `OrderStatusBadge`.
- `order_datetime` (gray).

**2. Estimated Time** (hide if `status === 13`):
- "Your estimate delivery time" label.
- `{preparation_time}min` (Rubik Bold 26).

**3. Customer Info:**
- Circle avatar (50×50) from `user.image` + "Customer" label + `user.name`.
- Phone button (circle, bg `#FFEDF4`, phone SVG icon):
  Press → `Linking.openURL('tel:' + calling_code + user.phone)`.

**4. Payment Info:**
- "Payment Info" heading.
- "Method : " + payment method:
  - `order_type === 5 && transaction === null` → "Cash On Delivery"
  - `order_type === 10 && transaction === null` → "Pick & Pay"
  - `transaction !== null` → `transaction.payment_method`
- "Status : " + "Paid" (green `#2AC769`) or "Unpaid" (red `#FB4E4E`) based on `payment_status` (5=paid, 10=unpaid).

**5. Delivery Address:**
- "Delivery Address" heading.
- Pink location SVG + `{apartment}, {address}` (max 3 lines).

**6. Order Summary card** (white, shadow, borderRadius 16):
- "Order Details" heading.
- For each `order_item`:
  - Row: item image (70×70, borderRadius 8) with quantity badge (dark circle top-left, white number) + item name (truncated) + variations (from `item_variations[].name`) + `total_currency_price`.
  - Extras row (if `item_extras.length > 0`): "Extras : name1, name2."
  - Instruction row (if `instruction` is not null/empty): "Instruction : {text}".
  - `Divider`.
- Price breakdown table (bordered, borderRadius 12):
  - Subtotal | `subtotal_currency_price`
  - Discount | `discount_currency_price`
  - Delivery Charge | `delivery_charge_currency_price` (green text)
  - Dashed separator
  - **Total** (bold) | **`total_currency_price`** (bold)

**7. Bottom Action Bar** (fixed, hide if `status === 13 || status === 22`):
- **Get Direction** button (full width, `#FF006B`, pill) → same map flow.
- **Confirm Delivery** button (full width, green, pill) — show ONLY when `status === 10`:
  - `payment_status === 10` (unpaid): show **Collect Payment Dialog**.
  - `payment_status === 5` (paid): show **Confirm Delivery Dialog**.

**Collect Payment Dialog:**
- Image: `collect_payment.png` (100×100).
- Desc: "Do You Collect Payment?"
- Content: "Amount : " + `total_currency_price` (large, `#008BBA`).
- Buttons: "No, Cancel" (gray bg) | "Yes, Collect" (pink bg) → calls `changeOrderStatus(id, 13)`.

**Confirm Delivery Dialog:**
- Image: `confirm.png` (100×100).
- Desc: "Are You Sure to Confirm Delivery?"
- Buttons: "No, Cancel" | "Yes, Confirm" → calls `changeOrderStatus(id, 13)`.

**changeOrderStatus(id, status):**
- POST `/api/frontend/delivery-boy-order/change-status/{id}` with body `{"status": 13}`.
- On 200: navigate to `ConfirmDeliveryScreen` passing `{orderSerialNo, orderDatetime}`, replacing current screen.

`LoaderOverlay` visible when `loaders.confirm` is true.

---

### 6.6 Confirm Delivery Screen

Params: `orderSerialNo`, `orderDatetime`.

- White background, all centered.
- `confirm.png` (180 height, 200 width).
- "Order Successfully Delivered" (Rubik Medium 16).
- "Order Id : " + `orderSerialNo` (color `#008BBA`).
- `orderDatetime` (gray, Rubik Regular 13).
- **Back to Home** button (full width, pink, pill) → navigate to `MainTabs` Home tab, reset stack.

---

### 6.7 History Screen

**App bar:** "Order History" (Rubik SemiBold 16).

Pull-to-refresh: `orderStore.getOrderList()`.

Source: `orderStore.previousOrderList` (status in `[13, 22]`).

Empty state: `EmptyState` with "You have no order history".

For each item — card (white, shadow, borderRadius 16):
- "Order Id : " + `order_serial_no` (color `#008BBA`) + `OrderStatusBadge`.
- `order_datetime` (gray).
- Location pin + `order_address.address` (truncated, max 2 lines).
- "See Order Details →" row (pink text + arrow SVG) → `getOrderDetails(id)` then navigate to `OrderDetailsScreen`.
- Full card is tappable → same as above.

`LoaderOverlay` visible when `loaders.details` is true.

---

### 6.8 Profile Screen

Scrollable, no system app bar (custom header).

- "My Profile" (Rubik Bold 16, centered).
- Profile photo stack:
  - Circle image (100×100 via `react-native-fast-image`) from `profileData.image`.
  - `dot_circle.png` overlay (105×105, centered).
  - Edit button (dark gray circle, bottom of photo): opens image picker (gallery only) → validates file size < 2MB → upload as multipart to `/api/profile/change-image` (field name: `image`) → refresh profile on success.
- `profileData.name` (Rubik Bold 16).
- `profileData.email` (gray, Rubik Medium 14) — only shown if not null.
- `{calling_code}{profileData.phone}` (gray, Rubik Medium 14).
- Branch row: SVG branch icon + "Branch" label + branch name (look up `branchId` in `branchDataList`; if `branchId === 0` show "All Branch").
- Menu items (icon + label + Divider):
  1. `icon_edit.svg` "Edit Profile" → `EditProfileScreen`
  2. `key.svg` "Change Password" → `ChangePasswordScreen`
  3. `lang.svg` "Change Language" → `ChangeLanguageScreen`
  4. Dynamic: for each page in `pageDataList`: `terms_condition.svg` + `page.title` → `PagesScreen`
- Log Out row (`logout.svg` + "Log Out"): clear `AsyncStorage`, reset all stores, navigate to `LoginScreen`.
- `LoaderOverlay` visible when `loaders.profile` is true.

---

### 6.9 Edit Profile Screen

App bar: back arrow only.

Form fields (outlined, borderRadius 8, focus border `#FF006B`, normal border `#EFF0F6`):
- First Name (required)
- Last Name (required)
- Email (required)
- Mobile Number: country prefix box (`{flag_emoji} {calling_code}`) + number input

**Update Profile** button (full width, pink, pill) →
PUT `/api/profile` with:
```json
{
  "first_name": "...", "last_name": "...",
  "email": "...", "phone": "...",
  "country_code": "{calling_code}"
}
```
On 200: refresh profile, go back, show success toast.
On error: show toast with `response.message`.

`LoaderOverlay` during `loaders.updateProfile`.

---

### 6.10 Change Password Screen

App bar: back arrow.
Title: "Change Password" (Rubik ExtraBold 18).

Three password fields (each with show/hide eye toggle):
- Old Password
- New Password (min 6 chars)
- Re-Type New Password

**Update** button (full width, pink, pill) →
PUT `/api/profile/change-password` with:
```json
{ "old_password": "...", "password": "...", "password_confirmation": "..." }
```
- 200: clear all fields, go back, success toast.
- 422: parse `errors.password[0]` or `errors.old_password[0]`, show toast.
- Other error: show generic toast.

`LoaderOverlay` during `loaders.changePassword`.

---

### 6.11 Change Language Screen

App bar: back arrow.
Title: "Change Language" (Rubik Black 26).

List from `configStore.languageList`. Each row (height 56, borderRadius 8):
- Flag image (24×24 rounded) from `language.image`.
- Language name (Rubik Medium 14).
- Checkmark SVG (`tick-circle.svg`) if `language.code === currentLanguageCode`.
- Selected: pink tint bg (`#FF006B` at 8% opacity), pink border.

On tap: `i18next.changeLanguage(code)`, save `languageCode` to `AsyncStorage`.

> FLAG FOR VERIFICATION: The Flutter app fetches translations from the server dynamically. Confirm whether the RN app should also fetch server-side translations or use only bundled strings.

---

### 6.12 Pages Screen

Params: `title`, `description` (HTML string).

App bar: back arrow + `title`.

Body: `react-native-render-html` displaying `description` with padding 16.

---

## 7. Reusable Components

### OrderStatusBadge
Props: `status`, `statusName`.
Pill badge with background and text color from the status code table.

### CustomButton
Props: `title`, `onPress`, `loading`, `disabled`, `variant` (`'primary'|'outline'|'success'|'danger'`).
Pill shape (borderRadius 26), full width, `ActivityIndicator` when `loading`.

### CustomInput
Props: `label`, `value`, `onChangeText`, `error`, `secureTextEntry`, `onToggleSecure`, `keyboardType`, `...rest`.
Outlined TextInput with label above. Focus border: `#FF006B`. Normal border: `#EFF0F6`. Error border: `#FF006B`. borderRadius 8.

### LoaderOverlay
Props: `visible`.
Absolute full-screen semi-transparent white overlay + centered `ActivityIndicator` (color: `#FF006B`).

### EmptyState
Props: `image`, `title`, `subtitle`.
Centered image + bold title + gray subtitle.

### SkeletonLoader
Animated shimmer placeholders for stat cards and order list items.

### ConfirmDialog
Props: `visible`, `onClose`, `onConfirm`, `title`, `description`, `image`, `confirmText`, `cancelText`, `extraContent`.
Modal with animated grow effect. Two buttons: cancel (gray bg) + confirm (primary/green bg).

### Toast
Use `react-native-toast-message` configured with:
- `success`: background `#2AC769`, white text.
- `error`: background `#FB4E4E`, white text.

---

## 8. State Management (Zustand)

### authStore.js
```js
// State: { token, justToken, isLoggedIn, branchId, user }
// Actions: login, logout, refreshToken, saveDeviceToken
// Persist token/isLoggedIn/branchId via AsyncStorage
```

### orderStore.js
```js
// State:
//   orderList: [],
//   activeOrderList: [],   // derived: status not in [13, 22]
//   previousOrderList: [], // derived: status in [13, 22]
//   orderDetails: null,
//   countData: { total_delivered: 0, total_returned: 0 },
//   loaders: { list: false, count: false, details: false, confirm: false }
// Actions: getOrderList, getOrderCount, getOrderDetails, changeOrderStatus
```

### profileStore.js
```js
// State:
//   profileData: null,
//   pageDataList: [],
//   branchDataList: [],
//   loaders: { profile: false, updateProfile: false, changePassword: false }
// Actions: getProfile, updateProfile, changePassword, updateProfileImage, getPages, getBranches
```

### configStore.js
```js
// State:
//   configData: null,
//   countryInfo: { calling_code: '', flag_emoji: '' },
//   languageList: []
// Actions: fetchConfig, fetchCountryInfo, fetchLanguages
```

---

## 9. API Client

### `src/api/client.js` (authenticated)
```js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.API_BASE_URL;
const LICENSE_CODE = process.env.API_LICENSE_CODE;

const client = axios.create({ baseURL: BASE_URL, timeout: 30000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers['Authorization'] = token;
  config.headers['x-api-key'] = LICENSE_CODE;
  config.headers['content-type'] = 'application/json';
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default client;
```

### `src/api/publicClient.js` (unauthenticated)
```js
// Same structure but NO Authorization header.
// Used for: login, config, country info, language list, pages, token refresh.
```

---

## 10. Firebase / Notifications

Maps to Flutter's `NotificationHelper` and `DeviceToken`:

```js
// src/utils/notifications.js

// 1. Call on Dashboard mount — request FCM permission (iOS: native prompt, Android 13+: POST_NOTIFICATIONS)
// 2. Get FCM token: messaging().getToken()
// 3. POST { token: fcmToken } to /api/frontend/device-token/mobile (fire-and-forget)
// 4. Foreground listener: messaging().onMessage(msg) → show local notification via @notifee/react-native
//    - Channel: 'High Importance Notifications', importance: HIGH
//    - Show title + body from msg.notification
// 5. Background handler: messaging().setBackgroundMessageHandler(async (msg) => { /* no-op for now */ })
// 6. Notification open handler: messaging().onNotificationOpenedApp — currently no deep-link target
```

> FLAG FOR VERIFICATION: The Flutter app's notification tap handler is not implemented (code is commented out). Confirm whether tapping a notification should open a specific order screen.

---

## 11. Navigation Flow

```
AppNavigator
├── SplashScreen  (initial route, no header)
├── AuthStack
│   └── LoginScreen
└── MainStack  (shown after login, replaces AuthStack)
    ├── MainTabNavigator  (bottom tabs)
    │   ├── HomeScreen
    │   ├── HistoryScreen
    │   └── ProfileScreen
    ├── OrderDetailsScreen  (stack, push from Home or History)
    ├── ConfirmDeliveryScreen  (stack, replace OrderDetails)
    ├── EditProfileScreen
    ├── ChangePasswordScreen
    ├── ChangeLanguageScreen
    └── PagesScreen
```

---

## 12. Known Flutter Bugs to Fix in React Native

1. **Null stat card values**: Flutter shows raw `null` string in stat cards before API returns. In RN, always render `0` as fallback until data loads.
2. **Token stored as object**: Flutter stores the raw decoded token object under `justToken`. In RN, store only the raw token string.
3. **Duplicate API calls**: `DashboardView.initState()` calls `getOrderList()` and `getOrderCount()` each twice. In RN, call each exactly once on mount.
4. **Image size check**: Flutter uses a custom `ImageSize` helper. In RN, use the `fileSize` field from `react-native-image-picker`'s response to enforce < 2MB (2 * 1024 * 1024 bytes).
5. **History tab anti-pattern**: Flutter calls `Get.put(HomeController())` inside the History build method. In RN, reference the shared `orderStore` directly — no re-initialization.

---

## 13. Assets to Copy

Copy from the Flutter project's `assets/` directory into `src/assets/` in the RN project.

**Images** (`assets/images/`):
- `logo.png` — app bar
- `app_logo.png` — launcher
- `splash_logo.png` — splash screen
- `avatar.png` — default profile fallback
- `confirm.png` — delivery confirmed dialog / screen
- `collect_payment.png` — payment collection dialog
- `order_empty.png` — empty orders state
- `dot_circle.png` — profile photo dotted border overlay
- `home.png`, `history.png`, `profile.png` — tab bar icons
- `edit.png` — profile photo edit overlay button
- `lost_connection.png` — no internet state

**SVG Icons** (`assets/icons/`):
- `order_complete.svg`, `return_delivery.svg` — home stat cards
- `location.svg` — address pin
- `call.svg` — phone button
- `back.svg` — navigation back arrow
- `arrow-right.svg` — "See Order Details" link
- `ticked-yes-square.svg`, `ticked-no-square.svg` — remember me checkbox
- `icon_edit.svg`, `key.svg`, `lang.svg`, `logout.svg` — profile menu items
- `doc.svg`, `terms_condition.svg` — static page menu items
- `tick-circle.svg` — language selection checkmark
- `branch.svg` — branch info icon

**Fonts** (`assets/fonts/`):
- `Rubik-Regular.ttf`
- `Rubik-Medium.ttf`
- `Rubik-Bold.ttf`
- `Rubik-Black.ttf`

Register fonts in `react-native.config.js`:
```js
module.exports = {
  assets: ['./src/assets/fonts/'],
};
```

---

## 14. Implementation Sequence

Follow this order to minimize blockers:

1. Folder structure, font registration, colors/typography constants.
2. API clients (`client.js`, `publicClient.js`), all service files.
3. Zustand stores (authStore, configStore, profileStore, orderStore).
4. `AppNavigator` skeleton with placeholder screens.
5. `SplashScreen` + config/language prefetch.
6. `LoginScreen` with full auth flow.
7. `MainTabNavigator` with placeholder tab screens.
8. `HomeScreen`: stat cards + shimmer + active orders list + empty state + location permission.
9. `OrderDetailsScreen`: all 7 body sections + both dialogs + status change.
10. `ConfirmDeliveryScreen`.
11. `HistoryScreen`.
12. `ProfileScreen`: photo upload, menu items, logout.
13. `EditProfileScreen`.
14. `ChangePasswordScreen`.
15. `ChangeLanguageScreen` + i18next integration.
16. `PagesScreen`.
17. Firebase/FCM: permission request, device token registration, foreground notifications.
18. Polish: Android back button, pull-to-refresh on all screens, error boundaries.

---

## 15. Testing Checklist

- [ ] Login with valid delivery boy (role_id=3) succeeds and navigates to Dashboard.
- [ ] Login with non-delivery-boy role shows correct rejection message.
- [ ] Login with wrong credentials shows API error message.
- [ ] App remembers login state across app restarts (token refresh on launch).
- [ ] Failed token refresh clears storage and returns to Login.
- [ ] Logout clears all AsyncStorage data and returns to Login.
- [ ] Home stat cards show correct total_delivered / total_returned.
- [ ] Stat cards show 0 (not null) before API returns.
- [ ] Shimmer shows during loading.
- [ ] Pull-to-refresh updates order list and counts.
- [ ] Empty state shows when no active orders.
- [ ] "See Details" card → navigates to Order Details with correct data.
- [ ] "Get Direction" → opens Google Maps when location permission granted.
- [ ] Location denied → shows error snackbar.
- [ ] Location permanently denied → shows alert with "Open Settings".
- [ ] Order Details shows all 7 sections correctly.
- [ ] Estimated time section hidden for status 13.
- [ ] "Confirm Delivery" button only visible for status 10.
- [ ] Unpaid orders (payment_status=10) → Collect Payment dialog.
- [ ] Paid orders (payment_status=5) → Confirm Delivery dialog.
- [ ] Confirming delivery navigates to Confirm Delivery screen.
- [ ] "Back to Home" resets to Home tab.
- [ ] History shows only status 13/22 orders.
- [ ] Tapping history card navigates to Order Details.
- [ ] Order Details from history has no action bar.
- [ ] Profile photo shows correctly from URL.
- [ ] Profile photo upload: gallery picker opens, 2MB check enforced, success refreshes photo.
- [ ] Edit Profile: all fields pre-filled, validation, success/error toast.
- [ ] Change Password: validation, old password error, success.
- [ ] Change Language: list from API, selection highlighted, language string changes.
- [ ] Static pages render HTML content.
- [ ] FCM foreground notification displays.
- [ ] Phone call button launches dialer with correct calling code.
- [ ] All status badges show correct colors.
- [ ] Order items show variations, extras, instructions when present.
- [ ] Price breakdown renders all line items.

---

## 16. Items Flagged for Verification

Confirm with the team before implementation:

1. **API credentials**: Confirm `baseUrl` and `licenseCode` for production vs. demo environments. Store in `.env`, never commit.
2. **Google Maps API key**: Required for `react-native-map-link` and `react-native-maps` (if added). Get from Google Cloud Console.
3. **Firebase config**: Need `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).
4. **Notification deep-link target**: Should tapping a push notification open a specific order? (Currently commented out in Flutter.)
5. **Server-side language translations**: Should the RN app fetch translations from the server API, or use bundled strings only?
6. **In-app map**: Does the team need an embedded map view (requires `react-native-maps` + API key), or is opening the Maps app sufficient?
7. **Connectivity screen**: Flutter assets include `lost_connection.png` but the screen is not implemented. Should the RN app show a "No Internet" screen?
8. **"Paid" typo**: The Flutter English strings file spells "Paid" as "Piad". Confirm correct spelling.
9. **Delete Account**: The Edit Profile screen in Flutter has a commented-out "Delete Account" button. Should this be implemented in RN?
10. **RTL support**: The Flutter app has Arabic localization. Does the RN app need full RTL layout support for Arabic?
