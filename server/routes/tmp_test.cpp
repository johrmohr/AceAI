#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
using namespace std;

// --- User Code Start ---
#include <unordered_map>
#include <vector>
using namespace std;
vector<int> twoSum(vector<int> nums, int target) { unordered_map<int,int> mp; for (int i = 0; i < (int)nums.size(); ++i) { int need = target - nums[i]; auto it = mp.find(need); if (it != mp.end()) return { it->second, i }; mp[nums[i]] = i; } return {}; }
// --- User Code End ---

static void printJsonVector(const vector<int>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        if (i) cout << ",";
        cout << v[i];
    }
    cout << "]";
}

int main(int argc, char** argv) {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    if (argc < 2) return 1;
    string mode = string(argv[1]);
    if (mode == "twoSum") {
        int n; if (!(cin >> n)) return 1;
        vector<int> nums(n);
        for (int i = 0; i < n; ++i) cin >> nums[i];
        int target; cin >> target;
        vector<int> res = twoSum(nums, target);
        printJsonVector(res);
        return 0;
    } else if (mode == "isPalindrome") {
        long long x; if (!(cin >> x)) return 1;
        bool res = isPalindrome((int)x);
        cout << (res ? "true" : "false");
        return 0;
    }
    return 1;
}
