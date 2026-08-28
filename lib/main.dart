my husband:
import 'package:flutter/material.dart';
import 'products_screen.dart';
import 'cart_screen.dart';

void main() {
  runApp(const AlghadeerStoreApp());
}

class AlghadeerStoreApp extends StatelessWidget {
  const AlghadeerStoreApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'الغدير للتسوق المنزلي',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  // عرض نافذة الاتصال المباشر برقمك الرسمي
  void _showContactOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        height: 180,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'تواصل مع إدارة متجر الغدير:',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 15),
            ListTile(
              leading: const Icon(Icons.phone, color: Colors.green, size: 30),
              title: const Text('اتصال مباشر', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('07738487299'),
              onTap: () {
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  // نافذة تتبع حالة الطلب للزبون (الخطوة الثالثة)
  void _showOrderTracker(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تتبع حالة طلبك - الغدير'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('حالة طلبك الحالي في المتجر:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 15),
            ListTile(
              leading: Icon(Icons.check_circle, color: Colors.green),
              title: Text('تم استلام الطلب بنجاح'),
            ),
            ListTile(
              leading: Icon(Icons.inventory, color: Colors.orange),
              title: Text('جاري التجهيز وفحص المنتجات'),
            ),
            ListTile(
              leading: Icon(Icons.local_shipping, color: Colors.blue),
              title: Text('خرج مع المندوب (دراجة / سيارة نقل أثاث)'),
            ),
            ListTile(
              leading: Icon(Icons.done_all, color: Colors.grey),
              title: Text('تم التوصيل بنجاح'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الغدير للأجهزة المنزلية والتجارة العامة'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'مرحباً بك في متجر الغدير',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            
            // شريط البحث الذكي
            TextField(
              controller: _searchController,

decoration: InputDecoration(
                hintText: 'ابحث عن جهاز، أثاث، أو مستلزمات...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                  },
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onSubmitted: (value) {
                if (value.isNotEmpty) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductsScreen(categoryName: 'نتائج البحث: $value'),
                    ),
                  );
                }
              },
            ),
            
            const SizedBox(height: 15),

            // قسم عروض وتخفيضات اليوم (الخطوة الثانية)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '🔥 تخفيضات الغدير الكبرى',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.red),
                      ),
                      SizedBox(height: 4),
                      Text('عروض خاصة على الأثاث والأجهزة المنزلية', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ProductsScreen(categoryName: 'عروض وتخفيضات اليوم'),
                        ),
                      );
                    },
                    child: const Text('تصفح العروض', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 15),
            
            // زر سريع لتتبع الطلبات
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.track_changes, color: Colors.blue),
                label: const Text('تتبع حالة طلباتي السابقة أو الحالية', style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: () => _showOrderTracker(context),
              ),
            ),

            const SizedBox(height: 15),
            const Text(
              'الأقسام الرئيسية:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 10),
            
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              children: [
                _buildCategoryCard(context, 'الأجهزة المنزلية', Icons.kitchen, Colors.orange),
                _buildCategoryCard(context, 'مستلزمات المطبخ', Icons.restaurant, Colors.green),
                _buildCategoryCard(context, 'قسم الأخشاب', Icons.carpenter, Colors.brown),

_buildCategoryCard(context, 'السلة والطلبات', Icons.shopping_cart, Colors.purple),
              ],
            ),
          ],
        ),
      ),
      // زر الاتصال العائم برقمك
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showContactOptions(context),
        backgroundColor: Colors.green,
        icon: const Icon(Icons.phone, color: Colors.white),
        label: const Text('اتصل بالمتجر', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildCategoryCard(BuildContext context, String title, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          if (title == 'السلة والطلبات') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const CartScreen(cartItems: []),
              ),
            );
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ProductsScreen(categoryName: title),
              ),
            );
          }
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 50, color: color),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
